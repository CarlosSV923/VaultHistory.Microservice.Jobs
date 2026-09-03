import { config as dotenvConfig } from 'dotenv';
import { defineConfig, env } from 'prisma/config';
import { resolve } from 'node:path';

const envFileName = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env.local';

dotenvConfig({ path: resolve(process.cwd(), 'config', envFileName) });

export default defineConfig({
    schema: `./schema.prisma`,
    migrations: {
        path: `./migrations`,
    },
    datasource: {
        url: env('DATABASE_URL'),
    },
});
