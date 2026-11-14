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

// An origin is scheme + host (+ port) with no path or trailing slash, exactly as browsers send it.
const isOrigin = (value: string): boolean => {
  try {
    return new URL(value).origin === value;
  } catch {
    return false;
  }
};

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

    // Comma-separated browser origins allowed to call the API and to send the refresh cookie, e.g.
    //   CORS_ORIGINS=https://my-app.netlify.app,http://localhost:5173
    // Empty (the default) means no cross-origin browser access at all.
    CORS_ORIGINS: z
      .string()
      .default('')
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim().replace(/\/+$/, ''))
          .filter(Boolean),
      )
      .refine((origins) => origins.every(isOrigin), {
        error:
          'CORS_ORIGINS must be comma-separated origins like https://example.com (no path)',
      }),

    // Serve Swagger UI at /docs. Unset means: on outside production, off in production.
    API_DOCS_ENABLED: z.stringbool().optional(),

    // How many reverse proxies sit in front of the app (0 locally). It decides which
    // X-Forwarded-For entry becomes req.ip, which rate limiting keys on: too low and every
    // user shares the proxy's IP, too high and clients can spoof theirs.
    TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),

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
