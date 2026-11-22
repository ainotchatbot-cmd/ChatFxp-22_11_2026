import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.SQL_HOST || '127.0.0.1',
    port: Number(process.env.SQL_PORT || 5432),
    user: process.env.SQL_USER || 'chatfxp',
    password: process.env.SQL_PASSWORD || 'change-this-local-password',
    database: process.env.SQL_DB_NAME || 'chatfxp',
  },
  strict: true,
  verbose: true,
});
