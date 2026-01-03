import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';


export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    GITHUB_TOKEN: z.string().min(1).optional(),
  },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
