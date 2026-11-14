import pino from 'pino';
import { env } from '@/config/env.js';

const isProduction = env.NODE_ENV === 'production';

const logger = pino({
  level: env.LOG_LEVEL,

  // Safety net: request logging only emits whitelisted fields (see requestLogger), but
  // anything logged by hand or by a library still passes through these paths.
  redact: {
    paths: [
      // Headers & Cookies
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',
      'req.headers["x-auth-token"]',
      'res.headers["set-cookie"]',

      // Sensitive fields at root and one level down
      'password',
      '*.password',
      'currentPassword',
      '*.currentPassword',
      'newPassword',
      '*.newPassword',
      'email',
      '*.email',
      'phone',
      '*.phone',
      'token',
      '*.token',
      'accessToken',
      '*.accessToken',
      'refreshToken',
      '*.refreshToken',
      'tokenHash',
      '*.tokenHash',
      'apiKey',
      '*.apiKey',
      'creditCard',
      '*.creditCard',
      'ssn',
      '*.ssn',

      // Explicit request body paths (if body logging is enabled later)
      'req.body.password',
      'req.body.currentPassword',
      'req.body.newPassword',
      'req.body.token',
      'req.body.secret',
    ],
    censor: '[REDACTED]',
  },

  ...(isProduction
    ? {
        // Raw JSON lines are what you read in the hosting dashboard: ISO times and
        // "level":"info" are far easier to scan than epoch milliseconds and "level":30.
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: { level: (label: string) => ({ level: label }) },
      }
    : {
        // Pretty-printing only outside production.
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            singleLine: true,
          },
        },
      }),
});

export default logger;
