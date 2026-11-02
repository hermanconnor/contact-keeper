import 'dotenv/config';
import { z } from 'zod';

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

    BASE_URL: z.string().default('http://localhost:5000'),
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
