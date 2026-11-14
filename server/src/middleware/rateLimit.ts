import rateLimit, { type Options } from 'express-rate-limit';
import { AppError } from '@/utils/AppError.js';

const MINUTE_MS = 60 * 1000;

/**
 * Allow any valid rate-limit options, but protect factory-managed
 * fields from being overridden by individual limiters.
 */
type LimiterOptions = Omit<
  Partial<Options>,
  'standardHeaders' | 'legacyHeaders' | 'handler'
>;

const createLimiter = (options: LimiterOptions) => {
  return rateLimit({
    ...options,
    standardHeaders: 'draft-7', // RateLimit / RateLimit-Policy + Retry-After
    legacyHeaders: false,
    // Hand off to errorHandler so a 429 has the same JSON shape as every other error.
    handler: (_req, _res, next) => {
      next(new AppError('Too many requests, please try again later', 429));
    },
  });
};

/** Everything under /api, per IP: a broad ceiling against scraping and floods. */
export const apiLimiter = createLimiter({
  windowMs: 15 * MINUTE_MS,
  limit: 300,
});

/** Failed logins only, per IP: slows password guessing without punishing normal use. */
export const loginLimiter = createLimiter({
  windowMs: 15 * MINUTE_MS,
  limit: 10,
  skipSuccessfulRequests: true,
});

/** Account creation, per IP: stops signup spam. Every request counts. */
export const registerLimiter = createLimiter({
  windowMs: 60 * MINUTE_MS,
  limit: 10,
});

/**
 * Endpoints that verify the current password (change password, delete account): a stolen
 * access token must not be able to brute-force it. Failed attempts only, per IP.
 */
export const sensitiveLimiter = createLimiter({
  windowMs: 15 * MINUTE_MS,
  limit: 5,
  skipSuccessfulRequests: true,
});
