import 'dotenv/config';
import { z } from 'zod';

const pinoLevels = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
] as const;

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),

    PORT: z.coerce.number().int().positive().default(5000),

    DATABASE_URL: z
      .string()
      .min(1, 'Must be a valid database connection string'),

    ACCESS_TOKEN_SECRET: z
      .string()
      .min(10, 'ACCESS_TOKEN_SECRET must be at least 10 characters'),

    REFRESH_TOKEN_SECRET: z
      .string()
      .min(10, 'REFRESH_TOKEN_SECRET must be at least 10 characters'),

    SESSION_LIFETIME_DAYS: z.coerce.number().int().min(1).max(365).default(7),

    BASE_URL: z.string().default('http://localhost:5000'),

    LOG_LEVEL: z
      .preprocess(
        (val) => (typeof val === 'string' ? val.toLowerCase() : val),
        z.enum(pinoLevels),
      )
      .default('info'),
  })
  .readonly();

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const flattened = z.flattenError(result.error);

  console.error('❌ Invalid or missing environment variables:');
  console.error(flattened.fieldErrors);
  process.exit(1);
}

export const env = result.data;

export type Env = z.infer<typeof envSchema>;
