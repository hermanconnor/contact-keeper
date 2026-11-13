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
    // Defaults to production so a deploy that forgets NODE_ENV fails safe (no stack traces
    // in error responses). Set NODE_ENV=development in your local .env.
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('production'),

    PORT: z.coerce.number().int().positive().default(5000),

    DATABASE_URL: z
      .string()
      .regex(
        /^mongodb(\+srv)?:\/\//,
        'DATABASE_URL must be a MongoDB connection string (mongodb:// or mongodb+srv://)',
      ),

    // HS256 wants a key of at least 256 bits. Generate one with:
    //   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
    ACCESS_TOKEN_SECRET: z
      .string()
      .min(32, 'ACCESS_TOKEN_SECRET must be at least 32 characters'),

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
  const pretty = z.prettifyError(result.error);

  console.error('❌ Invalid or missing environment variables:');
  console.error(pretty);
  process.exit(1);
}

export const env = result.data;

export type Env = z.infer<typeof envSchema>;
