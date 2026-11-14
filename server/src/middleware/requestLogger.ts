import { randomUUID } from 'node:crypto';
import type {
  IncomingHttpHeaders,
  IncomingMessage,
  ServerResponse,
} from 'node:http';
import type { Request } from 'express';
import type { LevelWithSilent } from 'pino';
import { pinoHttp, type Options } from 'pino-http';
import logger from '@/utils/logger.js';

// Health probes fire every few seconds and Swagger UI loads a dozen assets per page view:
// neither says anything useful.
const IGNORED_PATH = /^\/(?:api\/v1\/health|docs)(?:\/|$)/;

// Only reuse an incoming request ID if it is short and boring; otherwise make our own.
const SAFE_REQUEST_ID = /^[\w-]{1,64}$/;

/** The fields below exist on both a raw IncomingMessage and pino's serialized copy of it. */
interface LoggedRequest {
  id?: unknown;
  method?: string;
  url?: string;
  headers?: IncomingHttpHeaders;
}

/**
 * Added at the end of the request, so `userId` (set by `protect`) is available. `ip` is
 * Express's req.ip, which honours `trust proxy`; the socket address would just be the proxy.
 */
const requestContext = (req: IncomingMessage) => {
  const { ip, userId } = req as Request;

  return { ip, userId };
};

const pinoOptions: Options = {
  logger,

  // Unique across restarts and instances (pino's default is a per-process counter), and
  // echoed back so a user can quote it when reporting a problem.
  genReqId(req: IncomingMessage, res: ServerResponse) {
    const incoming = req.headers['x-request-id'];
    const id =
      typeof incoming === 'string' && SAFE_REQUEST_ID.test(incoming)
        ? incoming
        : randomUUID();

    res.setHeader('X-Request-Id', id);

    return id;
  },

  // Whitelist what gets logged instead of scrubbing what shouldn't be. Headers are left out
  // entirely (smaller lines, nothing sensitive to leak), and the query string is dropped:
  // it can hold search terms, tokens and other personal data (e.g. /contacts?search=jane).
  serializers: {
    req: (req: LoggedRequest) => ({
      id: req.id,
      method: req.method,
      url: req.url?.split('?')[0],
      userAgent: req.headers?.['user-agent'],
      origin: req.headers?.origin,
    }),
    res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
  },

  customSuccessObject: (req, _res, val) => ({
    ...val,
    ...requestContext(req),
  }),

  customErrorObject: (req, _res, _error, val) => ({
    ...val,
    ...requestContext(req),
  }),

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

  autoLogging: {
    ignore: (req: IncomingMessage): boolean => IGNORED_PATH.test(req.url ?? ''),
  },
};

const requestLogger = pinoHttp(pinoOptions);

export default requestLogger;
