import { defineConfig } from 'drizzle-kit';
import { env } from './env';

export default defineConfig({
  out: './db/drizzle',
  schema: './db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
