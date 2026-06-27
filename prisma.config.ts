import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

const basepath = 'src/infrastructure/persistence/prisma/';

export default defineConfig({
    schema: `${basepath}schema.prisma`,
    migrations: {
        path: `${basepath}migrations`,
    },
    datasource: {
        url: env('DATABASE_URL'),
    },
});
