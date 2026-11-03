import pino from 'pino';
import { env } from '@/config/env.js';

const isProduction = env.NODE_ENV === 'production';

const logger = pino({
  level: env.LOG_LEVEL ?? 'info',

  redact: {
    paths: [
      // Headers & Cookies
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',
      'req.headers["x-auth-token"]',
      'res.headers["set-cookie"]',

      // Sensitive fields at root and nested levels (using wildcards)
      'password',
      '*.password',
      'email',
      '*.email',
      'phone',
      '*.phone',
      'token',
      '*.token',
      'refreshToken',
      '*.refreshToken',
      'apiKey',
      '*.apiKey',
      'creditCard',
      '*.creditCard',
      'ssn',
      '*.ssn',

      // Explicit request body paths (if body logging is enabled later)
      'req.body.password',
      'req.body.token',
      'req.body.secret',
    ],
    censor: '[REDACTED]',
  },

  // Conditionally include transport only in non-production environments
  ...(!isProduction && {
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
