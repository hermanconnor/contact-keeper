import type { RequestHandler } from 'express';
import { env } from '@/config/env.js';
import { AppError } from '@/utils/AppError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const allowedOrigins = new Set(env.CORS_ORIGINS);

/**
 * CSRF defence for the refresh cookie. CORS only stops a foreign site from *reading* a
 * response; a bodyless POST to /auth/refresh or /auth/logout is a "simple" request that the
 * browser sends (with cookies, where third-party cookies are allowed) without a preflight.
 * Browsers always attach `Origin` to cross-site POSTs, so a state-changing request from an
 * origin that isn't allowlisted is refused here.
 *
 * Requests with no Origin header (Postman, curl, server-to-server) pass: they aren't
 * browser-driven, so they can't be used for CSRF.
 */
export const verifyOrigin: RequestHandler = (req, _res, next) => {
  const origin = req.get('origin');

  if (!origin || SAFE_METHODS.has(req.method) || allowedOrigins.has(origin)) {
    next();
    return;
  }

  // Same-origin requests (Swagger UI served by this API) are never CSRF: a foreign site
  // can't make a browser send our own origin.
  if (origin === `${req.protocol}://${req.get('host')}`) {
    next();
    return;
  }

  throw new AppError('Origin not allowed', 403);
};
