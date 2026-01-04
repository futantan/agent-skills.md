import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';


export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    GITHUB_TOKEN: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().min(1),
    NEXT_PUBLIC_PLAUSIBLE_DATA_DOMAIN: z.string().min(1),
  },
  runtimeEnv: {
    NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
    NEXT_PUBLIC_PLAUSIBLE_DATA_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DATA_DOMAIN,
    DATABASE_URL: process.env.DATABASE_URL,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
