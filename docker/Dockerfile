FROM node:24.16.0-bookworm-slim AS build

WORKDIR /app

RUN apt-get update \
    && apt-get install --yes --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@11.25.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Prisma requires DATABASE_URL while resolving its configuration during generation.
ENV DATABASE_URL=postgresql://vault_history:vault_history@postgres:5432/vault_history?schema=public

RUN pnpm prisma:generate && pnpm build

FROM node:24.16.0-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
    && apt-get install --yes --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@11.25.0 --activate

COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/infrastructure/persistence/prisma ./src/infrastructure/persistence/prisma

EXPOSE 3000

CMD ["node", "dist/main"]
