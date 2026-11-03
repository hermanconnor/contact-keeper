import { IncomingMessage, ServerResponse } from 'http';
import type { Request } from 'express';
import type { LevelWithSilent } from 'pino';
import { pinoHttp, type Options } from 'pino-http';
import logger from '@/utils/logger.js';

const pinoOptions: Options = {
  logger,

  // Custom serializer to scrub sensitive query params from req.url
  serializers: {
    req(req: IncomingMessage & Partial<Request>) {
      if (req.url) {
        try {
          // Parse URL to inspect and sanitize query string parameters
          const urlObj = new URL(req.url, 'http://localhost');
          const sensitiveParams = [
            'token',
            'api_key',
            'apiKey',
            'secret',
            'password',
            'code',
            'auth',
          ];

          let modified = false;

          sensitiveParams.forEach((param) => {
            if (urlObj.searchParams.has(param)) {
              urlObj.searchParams.set(param, '[REDACTED]');
              modified = true;
            }
          });

          if (modified) {
            req.url = urlObj.pathname + urlObj.search;
          }
        } catch (err) {
          // Fallback gracefully: don't crash the app, but log it at debug level for troubleshooting
          logger.debug(
            { err, url: req.url },
            'Failed to parse request URL for sanitization',
          );
        }
      }

      return req;
    },
  },

  // Tailor log severity by status code with explicit return typing
  customLogLevel(
    _req: IncomingMessage,
    res: ServerResponse,
    err?: Error,
  ): LevelWithSilent {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    if (res.statusCode >= 300) return 'silent'; // Skip redirect noise

    return 'info';
  },

  // Ignore health checks to prevent log clutter with typed request parameter
  autoLogging: {
    ignore(req: IncomingMessage): boolean {
      const url = req.url ?? '';
      return url === '/health' || url === '/ping' || url === '/healthz';
    },
  },
};

const requestLogger = pinoHttp(pinoOptions);

export default requestLogger;
