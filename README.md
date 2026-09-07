# VaultHistory.Microservice.Jobs

Microservicio desarrollado con NestJS para ejecutar tareas asincronas del sistema VaultHistory.

Este repositorio documenta principalmente aspectos tecnicos del proyecto: arquitectura, ejecucion local, Docker, PostgreSQL, Prisma, Kafka, tareas programadas y flujo de pruebas.

## Stack Tecnico

- Node.js 24
- TypeScript
- NestJS
- PostgreSQL 17
- Prisma 7
- Apache Kafka 4
- Docker / Docker Compose
- Jest
- Supertest
- Volta, opcional para fijar versiones

## Arquitectura

El proyecto esta organizado por capas, separando dominio, casos de uso, infraestructura y API.

```txt
src/
  api/
    consumers/
    scheduling/cron/
  application/
    messaging/
    use-cases/
  domain/
    abstractions/
    outbox/
    users/
  infrastructure/
    messaging/kafka/
    persistence/prisma/
    producers/
    repositories/
  app.module.ts
  main.ts

test/
  api/
  application/
  domain/
  infrastructure/
  integration/
```

### Domain

Contiene el modelo de dominio y los contratos principales del sistema.

Incluye:

- Entidades de usuarios y mensajes outbox.
- Abstracciones compartidas `Result` y `Error`.
- Estados y tipos de notificacion/outbox.
- Interfaces/puertos de repositorios.

Esta capa no depende de Prisma, Kafka ni otros detalles concretos de infraestructura.

### Application

Contiene los casos de uso y la logica de aplicacion.

Incluye:

- Publicacion de eventos mediante `EventPublisherPort`.
- Actualizacion de usuarios recibida desde Kafka.
- Actualizacion de mensajes outbox recibida desde Kafka.
- Notificacion de inicios de sesión pendientes.
- Notificacion de usuarios que cumplen anos.
- Procesamiento de mensajes outbox pendientes.

### Infrastructure

Contiene las implementaciones concretas de persistencia y mensajeria.

Incluye:

- `PrismaService` y cliente Prisma para PostgreSQL.
- Repositorios Prisma de usuarios y mensajes outbox.
- Cliente consumidor y productor de Kafka.
- Adaptador de publicacion de eventos.
- Configuracion de topics, consumer group y reintentos de Kafka.

### Api

En este microservicio, la capa API coordina consumidores y tareas programadas; no expone endpoints HTTP de negocio.

Incluye:

- Consumidor de actualizaciones de usuarios.
- Consumidor de actualizaciones de mensajes outbox.
- Cron para notificar usuarios con mensajes outbox pendientes.
- Cron para notificar usuarios que cumplen anos.
- Cron para procesar mensajes outbox pendientes.

## Flujo De Procesamiento

El servicio se ejecuta como un worker y combina tareas programadas con mensajeria Kafka.

### Tareas programadas

Las tareas se registran durante el inicio de la aplicacion y utilizan las expresiones configuradas en el ambiente:

```txt
notify-outbox-cron  -> busca inicios de sesión y publica notificaciones.
notify-user-cron    -> busca usuarios cuyo cumpleanos coincide y publica historias.
process-outbox-cron -> marca como procesados cambios de usuario ya consumidos.
```

### Kafka

Topics consumidos:

```txt
KAFKA_UPDATE_USERS_TOPIC  -> actualiza el estado de notificacion de usuarios.
KAFKA_UPDATE_OUTBOX_TOPIC -> actualiza el estado de mensajes outbox.
```

Topics publicados:

```txt
KAFKA_NOTIFY_HISTORY_TOPIC -> solicita la generacion de una historia.
KAFKA_NOTIFY_OUTBOX_TOPIC  -> notifica un inicio de sesión de usuario.
```

### Contratos Kafka

Los mensajes se publican como JSON UTF-8 en `camelCase`. Las fechas se serializan en formato ISO 8601 UTC. Los fixtures de referencia se encuentran en `test/fixtures/kafka`.

`notify-history-topic` solicita una historia para un usuario elegible:

```json
{
  "userId": "user-id",
  "email": "person@example.com",
  "fullname": "Person Name",
  "birthDate": "2000-01-01T00:00:00.000Z",
  "theme": null,
  "character": null
}
```

`notify-outbox-topic` conserva la correlación con el registro outbox que debe actualizarse después del envío:

```json
{
  "outboxId": "outbox-id",
  "userId": "user-id",
  "email": "person@example.com",
  "fullname": "Person Name",
  "birthDate": "2000-01-01T00:00:00.000Z",
  "type": "UserSignedInEvent",
  "occurredOn": "2026-09-05T12:30:00.000Z"
}
```

`UserSignedInEvent` es el tipo de outbox que activa este flujo de notificación. `CreateUserEvent` se procesa por el flujo general de outbox y no se publica en `notify-outbox-topic`.

Antes de publicar, Jobs valida que el evento tenga `userId` y consulta al usuario sin filtrar su estado. Un payload inválido, un usuario inexistente o un usuario inactivo deja el outbox en `ERROR` con `USER_ID_MISSING`, `USER_NOT_FOUND` o `USER_INACTIVE`, respectivamente. De este modo el cron no deja registros en `IN_PROCESS` sin una ruta explícita de recuperación.

Los resultados consumidos por Jobs actualizan una sola entidad y usan `id` como identificador escalar:

```json
{ "id": "user-id", "data": { "notificationStatus": "NOTIFIED", "notificationDate": "2026-09-05T12:31:00.000Z" } }
```

```json
{ "id": "outbox-id", "data": { "status": "PROCESSED", "error": null } }
```

Los consumers no aceptan el formato heredado `ids`. Antes de desplegar productores de Notification, se deben drenar o transformar los mensajes de resultado antiguos; un mensaje de outbox sin `outboxId` no puede actualizarse de forma segura.

Internamente, los repositorios conservan operaciones por lote y reciben un arreglo de un elemento.

El consumer group se configura mediante `KAFKA_GROUP_ID`. Kafka utiliza `KAFKA_BROKER` como broker principal y reintenta las operaciones de consumo y publicacion cuando ocurren errores transitorios.

### Selección y recuperación

Los cumpleaños se comparan por mes y día en UTC, sin considerar el año de nacimiento. El 29 de febrero se notifica solamente en años bisiestos. Un usuario con estado `ERROR` no se selecciona otra vez de forma automática durante el mismo flujo.

Antes de publicar, Jobs reserva los registros con `IN_PROCESS`. Si la publicación falla de forma conocida, cambia el registro a `ERROR`: los usuarios reciben fecha nula y los outbox reciben `NOTIFICATION_PUBLISH_FAILED`. La recuperación automática no reenvía resultados cuya publicación pudo haber sido incierta.

Para recuperar registros antiguos que permanezcan en `IN_PROCESS`, revisar primero la causa y los logs. Tras confirmar que no se enviaron o procesaron, marcarlos manualmente como `ERROR` para investigarlos o reprogramarlos mediante un procedimiento controlado:

```sql
UPDATE users
SET "notificationStatus" = 'ERROR', "notificationDate" = NULL
WHERE "notificationStatus" = 'IN_PROCESS';

UPDATE outbox_messages
SET status = 'ERROR', error = 'MANUAL_RECOVERY'
WHERE status = 'IN_PROCESS';
```

No ejecutar estas sentencias de forma ciega: validar el rango de IDs y el estado de Kafka/Notification antes de aplicarlas.

## Domain-Driven Design

El proyecto aplica conceptos de Domain-Driven Design para mantener el dominio aislado y expresivo.

Conceptos utilizados:

- **Entities**: objetos con identidad propia, como `User` y `Outbox`.
- **Ports**: contratos definidos desde el dominio para acceder a repositorios y servicios externos.
- **Adapters**: implementaciones concretas de los puertos en infraestructura.
- **Result Pattern**: respuesta explicita de exito o error para el flujo esperado.
- **Error Entity**: representacion uniforme de errores de dominio, persistencia o mensajeria.

## Configuracion Local

La aplicacion carga configuracion desde la carpeta:

```txt
config/
```

El archivo cargado depende de `NODE_ENV`:

```txt
config/.env.local
config/.env.test
config/.env.production
config/.env.docker
```

El archivo `.env.docker` no se incluye actualmente en el repositorio; Docker Compose proporciona las variables del ambiente `docker` directamente en el servicio `app`. Para ejecucion local se usa `NODE_ENV=local` y se recomienda partir de `config/.env.local.example`.

Ejemplo:

```env
DATABASE_URL="postgresql://vault_history:vault_history@localhost:5432/vault_history?schema=public"

OUTBOX_QUERY_LIMIT=30
USER_QUERY_LIMIT=30

NOTIFY_OUTBOX_CRON_EXPRESSION="0 */3 * * * *"
NOTIFY_USER_CRON_EXPRESSION="0 */3 * * * *"
PROCESS_OUTBOX_CRON_EXPRESSION="0 */3 * * * *"

KAFKA_BROKER="localhost:9094"
KAFKA_NOTIFY_OUTBOX_TOPIC="notify-outbox-topic"
KAFKA_NOTIFY_HISTORY_TOPIC="notify-history-topic"
KAFKA_UPDATE_USERS_TOPIC="update-users-topic"
KAFKA_UPDATE_OUTBOX_TOPIC="update-outbox-topic"
KAFKA_CLIENT_ID="vault-history-microservice-jobs"
KAFKA_GROUP_ID="vault-history-microservice-jobs-group"
```

Cuando la aplicacion corre dentro de Docker, debe usar los nombres de servicio de Compose:

```env
DATABASE_URL="postgresql://vault_history:vault_history@postgres:5432/vault_history?schema=public"
KAFKA_BROKER="kafka:9092"
```

La expresion de cron usa el formato de seis campos de la libreria `cron`, incluyendo segundos. Por ejemplo, `0 */3 * * * *` ejecuta una tarea cada tres minutos.

## Instalar Dependencias

Desde la raiz del repositorio:

```bash
pnpm install
pnpm prisma:generate
```

## Ejecutar Con pnpm

Antes de iniciar, asegure que PostgreSQL y Kafka esten disponibles y que exista el archivo de configuracion correspondiente.

Para iniciar en modo local:

```bash
pnpm run start
```

Para ejecutar en modo watch:

```bash
pnpm run start:dev
```

Para ejecutar en modo debug:

```bash
pnpm run start:debug
```

Para compilar el proyecto:

```bash
pnpm run build
```

Para ejecutar la version compilada en modo produccion:

```bash
pnpm run start:prod
```

El proceso Nest escucha por defecto en `http://localhost:3000`, pero este microservicio no expone endpoints HTTP de negocio. Su funcionamiento principal ocurre mediante los cron jobs y los mensajes Kafka.

## Ejecutar Con Docker

La configuracion Docker se encuentra en:

```txt
docker/
  Dockerfile
  docker-compose.yml
```

Docker Compose levanta la aplicacion, PostgreSQL y un broker Kafka de un solo nodo:

```bash
docker compose -f docker/docker-compose.yml up --build
```

Antes de iniciarlo, levanta `VaultHistory.Microservice.User/docker/docker-compose.yml`; ese proyecto crea PostgreSQL y la red externa `vault-history-user_default` que Jobs utiliza. De esta manera ambos servicios operan sobre la misma base `vault_history` sin competir por su esquema.

La aplicacion queda disponible en `http://localhost:3000`, PostgreSQL en `localhost:5432` y Kafka para clientes del host en `localhost:9094`.

La imagen genera el cliente Prisma durante el build. El esquema compartido es propiedad de `VaultHistory.Microservice.User`, por lo que Jobs no ejecuta migraciones al iniciar.

Para detener los contenedores:

```bash
docker compose -f docker/docker-compose.yml down
```

Para detenerlos y eliminar los datos persistidos de PostgreSQL y Kafka:

```bash
docker compose -f docker/docker-compose.yml down -v
```

Los datos se almacenan en los volumenes Docker `postgres_data` y `kafka_data`.

## PostgreSQL Y Prisma

El proyecto usa PostgreSQL como base de datos y Prisma como ORM.

El esquema se encuentra en:

```txt
src/infrastructure/persistence/prisma/schema.prisma
```

Modelos principales:

```txt
User   -> users
Outbox -> outbox_messages
```

`User` almacena la informacion necesaria para notificaciones de cumpleanos y el estado de la notificacion. `Outbox` almacena eventos de dominio pendientes, procesados o en proceso.

Comandos utiles:

```bash
pnpm run prisma:generate
pnpm run prisma:validate
pnpm run prisma:studio
```

Jobs valida y genera su cliente Prisma, pero no crea ni aplica migraciones. `VaultHistory.Microservice.User` es el único proyecto autorizado a evolucionar las tablas compartidas `users` y `outbox_messages` mediante EF Core.

## Flujo Recomendado Para Cambios De Base De Datos

Cada vez que se modifique el modelo persistente compartido:

```txt
1. Actualizar el modelo y la migración de `VaultHistory.Microservice.User`.
2. Reflejar el contrato en `schema.prisma`.
3. Ejecutar `pnpm prisma:generate` y `pnpm prisma:validate` en Jobs.
4. Ajustar entidades, puertos, repositorios o mappers, si aplica.
5. Actualizar o agregar pruebas unitarias.
6. Actualizar pruebas de integración cuando cambie el comportamiento persistente.
7. Probar ambos proyectos contra la misma base de datos.
```

Para probar Docker desde cero despues de cambios de persistencia:

```bash
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up --build
```

## Tests

Ejecutar todos los tests unitarios:

```bash
pnpm run test
```

Ejecutar tests en modo watch:

```bash
pnpm run test:watch
```

Ejecutar tests con cobertura:

```bash
pnpm run test:cov
```

Ejecutar la suite configurada para pruebas end-to-end:

```bash
pnpm run test:e2e
```

Las pruebas de integracion existentes verifican el arranque del modulo, el registro de los tres cron jobs, la ejecucion de tareas y la resolucion de consumidores. Las dependencias de PostgreSQL y Kafka se reemplazan por mocks en esa suite para evitar requerir servicios externos.

## Calidad De Codigo

Formatear codigo:

```bash
pnpm run format
```

Ejecutar ESLint con autofix:

```bash
pnpm run lint
```

## Herramientas Necesarias

- Node.js 24
- pnpm 11
- Docker Desktop
- PostgreSQL, opcional si se usa Docker
- Apache Kafka, opcional si se usa Docker
- Volta, opcional pero recomendado para fijar versiones

Habilitar pnpm mediante Corepack:

```bash
corepack enable
```

## Manejo De Versiones Con Volta

El proyecto declara las versiones recomendadas en `package.json` mediante Volta:

```json
{
    "volta": {
        "node": "24.16.0",
        "pnpm": "11.25.0"
    }
}
```

Volta es opcional, pero ayuda a asegurar que los entornos de desarrollo utilicen las mismas versiones.

Instalar Volta en Windows:

```bash
winget install Volta.Volta
```

Verificar la instalacion:

```bash
volta --version
node --version
pnpm --version
```
