import type { RequestHandler, Request } from 'express';
import { AppError } from '@/utils/AppError.js';
import { verifyAccessToken } from '@/utils/tokens.js';

const BEARER = /^Bearer +([A-Za-z0-9\-._~+/]+=*)$/i;

export function getBearerToken(req: Request): string | undefined {
  return BEARER.exec(req.get('authorization') ?? '')?.[1];
}

export const protect: RequestHandler = (req, res, next) => {
  const token = getBearerToken(req);

  try {
    if (!token) throw new AppError('Unauthorized, no access token', 401);

    req.userId = verifyAccessToken(token).userId;
  } catch (error) {
    res.set(
      'WWW-Authenticate',
      token
        ? 'Bearer realm="api", error="invalid_token"'
        : 'Bearer realm="api"',
    );

    throw error;
  }

  next();
};

export function requireUserId(req: Request): string {
  if (!req.userId) throw new AppError('Not authorized', 401);

  return req.userId;
}
