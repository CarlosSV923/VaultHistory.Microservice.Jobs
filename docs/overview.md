# Jobs service documentation

Jobs is a NestJS worker that schedules notification work, publishes Kafka messages and applies correlated results to PostgreSQL. It uses DDD layers and Prisma adapters against the User-owned shared schema.

- Interactive diagram: [Jobs architecture](architecture/jobs-architecture.html)
- Editable diagram source: [jobs-architecture.json](architecture/jobs-architecture.json)
- Commands: `pnpm install`, `pnpm prisma:generate`, `pnpm build`, `pnpm test`
- Central Docker environment: [Vault.History.System](https://github.com/CarlosSV923/Vault.History.System)

Jobs publishes `notify-history-topic` and `notify-outbox-topic`; it consumes `update-users-topic` and `update-outbox-topic`. Result contracts use a scalar `id`. The worker has no business HTTP endpoints.
