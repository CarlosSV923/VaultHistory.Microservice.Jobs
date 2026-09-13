# Vault History Jobs

Vault History Jobs is a NestJS worker that schedules notification work, publishes it to Kafka, and applies correlated delivery outcomes to the shared PostgreSQL database. It has no public business HTTP API.

The service is part of the [Vault History System](https://github.com/CarlosSV923/Vault.History.System). It works with the User service, the History and Notification downstream services, PostgreSQL, and Kafka.

## Architecture

![Vault History Jobs service architecture](docs/architecture/jobs-architecture.png)

The scheduler invokes Jobs use cases. They read and reserve user or outbox records through Prisma, publish notification work to Kafka, and consume results from downstream services to update the original record. The image is a checked static preview of the interactive diagram.

- [Interactive architecture diagram](docs/architecture/jobs-architecture.html)
- [Editable architecture source](docs/architecture/jobs-architecture.json)

## Responsibilities

Jobs registers three configured cron jobs at startup:

- `notify-user-cron` selects eligible users whose birthday matches the current UTC day and publishes story-notification work.
- `notify-outbox-cron` selects pending sign-in and account-creation outbox events, validates their user data, and publishes delivery work.
- `process-outbox-cron` marks the remaining supported user-change outbox events as processed without requesting an email.

Before notification work is published, eligible records are reserved with `IN_PROCESS`. Known validation or publication failures are persisted as `ERROR`; downstream results later move records to their reported state. Jobs never exposes a business endpoint: scheduled jobs and Kafka consumers are its runtime entry points.

## Kafka contracts

| Direction | Topic configuration | Purpose |
| --- | --- | --- |
| Published | `KAFKA_NOTIFY_HISTORY_TOPIC` | Request birthday-story notification work. |
| Published | `KAFKA_NOTIFY_OUTBOX_TOPIC` | Request sign-in or welcome-email work while preserving `outboxId`. |
| Consumed | `KAFKA_UPDATE_USERS_TOPIC` | Apply a user notification outcome by scalar `id` (`userId`). |
| Consumed | `KAFKA_UPDATE_OUTBOX_TOPIC` | Apply an outbox outcome by scalar `id` (`outboxId`). |

Messages are JSON in camelCase and dates use ISO 8601 UTC. User and outbox results deliberately use one scalar `id`; legacy `ids` arrays are rejected. The relevant message fixtures are in `test/fixtures/kafka`.

`CreateUserEvent` is routed through the outbox notification flow so Notification can render its existing welcome template. Other supported user-change events are handled by `process-outbox-cron` and do not trigger a notification.

## Notification eligibility and recovery

Birthday selection requires an active user with notifications enabled. A confirmed notification makes a user ineligible only for that calendar year; prior-year `ERROR` and `IN_PROCESS` checkpoints do not prevent a later annual notification. A 29 February birthday is notified on 28 February in a non-leap year.

Users and outbox messages retain processing metadata such as attempts, processing start, next retry, failure stage, and failure reason. A safe temporary failure can return a user to `PENDING` with `notificationNextRetryAt`; permanent failures remain `ERROR` with diagnostic context. A potentially uncertain external publication or delivery must be reconciled before manual replay rather than being blindly resent.

For a controlled investigation of stranded records, first verify their identifiers, logs, Kafka state, and Notification outcome. Then apply a narrowly scoped recovery update approved for the incident. Do not run a blanket reset of every `IN_PROCESS` record.

## Technology

- Node.js 24 and TypeScript
- NestJS 11, `@nestjs/schedule`, and `cron`
- PostgreSQL 17 with Prisma 7 and `@prisma/adapter-pg`
- Apache Kafka with KafkaJS
- Jest and Supertest

## Project structure

```text
src/
  api/                 Kafka consumers and cron registration
  application/         Use cases and messaging ports
  domain/              Entities, state, errors, and repository ports
  infrastructure/      Prisma repositories, Kafka client, and publishers
  app.module.ts

test/                  Unit, contract, and integration tests
config/                Environment examples
docs/architecture/     Static PNG, interactive HTML, and editable diagram source
```

## Prerequisites and configuration

Use Node.js `24.16.0` and pnpm `11.25.0` (declared in `package.json`). PostgreSQL and Kafka must be reachable before starting the worker; the central Docker setup is maintained in [Vault.History.System](https://github.com/CarlosSV923/Vault.History.System).

Start from `config/.env.local.example`. The application loads `config/.env.<NODE_ENV>` and requires values such as:

```env
DATABASE_URL="postgresql://vault_history:vault_history@localhost:5432/vault_history?schema=public"
KAFKA_BROKER="localhost:9094"
KAFKA_NOTIFY_HISTORY_TOPIC="notify-history-topic"
KAFKA_NOTIFY_OUTBOX_TOPIC="notify-outbox-topic"
KAFKA_UPDATE_USERS_TOPIC="update-users-topic"
KAFKA_UPDATE_OUTBOX_TOPIC="update-outbox-topic"
KAFKA_CLIENT_ID="vault-history-microservice-jobs"
KAFKA_GROUP_ID="vault-history-microservice-jobs-group"
```

Cron expressions use the six-field format supported by `cron`, including seconds. Query limits, retry settings, and cron expressions are configured through the same environment file. Do not commit provider credentials or production connection strings.

## Running locally

```bash
pnpm install
pnpm prisma:generate
pnpm start
```

Useful commands:

```bash
pnpm start:dev
pnpm build
pnpm prisma:validate
pnpm test
pnpm test:e2e
pnpm lint
```

For the full local environment, run Docker Compose from the central orchestration repository. Inside Compose, use service hostnames such as `postgres:5432` and `kafka:9092` rather than local host ports.

## Shared database ownership

Jobs uses Prisma against the shared `users` and `outbox_messages` tables. It generates and validates its client but does not create migrations. The [User microservice](https://github.com/CarlosSV923/VaultHistory.Microservice.User) owns schema evolution; update that service's migration first, then align this Prisma schema and regenerate the client.

## Testing

Unit tests cover domain rules, use cases, Kafka infrastructure, and Prisma repositories. Contract fixtures check the published and consumed Kafka payloads. Integration tests mock PostgreSQL and Kafka so they can verify Nest module startup, cron registration, use-case dispatch, and consumer resolution without external services or real notification delivery.

## Related repositories

- [Vault.History.System](https://github.com/CarlosSV923/Vault.History.System) — Docker orchestration and system documentation
- [VaultHistory.Microservice.User](https://github.com/CarlosSV923/VaultHistory.Microservice.User) — user API and shared database migrations
- [VaultHistory.Microservice.History](https://github.com/CarlosSV923/VaultHistory.Microservice.History) — story generation and storage
- [VaultHistory.Microservice.Notification](https://github.com/CarlosSV923/VaultHistory.Microservice.Notification) — story and email delivery
- [Portfolio Vault History System project](https://github.com/users/CarlosSV923/projects/3)
