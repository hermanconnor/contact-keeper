import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Types } from 'mongoose';
import { z } from 'zod';
import { env } from '@/config/env.js';
import { AppError } from './AppError.js';

export const ACCESS_TTL_SECONDS = 15 * 60;

const ALGORITHM = 'HS256';

const accessPayloadSchema = z.object({ userId: z.string().min(1) });
export type AccessTokenPayload = z.infer<typeof accessPayloadSchema>;

export const generateAccessToken = (
  userId: Types.ObjectId | string,
): string => {
  return jwt.sign({ userId: userId.toString() }, env.ACCESS_TOKEN_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: ACCESS_TTL_SECONDS,
  });
};

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET, {
      algorithms: [ALGORITHM],
    });

    return accessPayloadSchema.parse(payload);
  } catch (error) {
    const message =
      error instanceof jwt.TokenExpiredError
        ? 'Token expired'
        : 'Invalid token';

    throw new AppError(message, 401, { cause: error });
  }
}

const REFRESH_TOKEN_SHAPE = /^[0-9a-f]{128}$/;

export const generateRefreshToken = (): string => {
  return randomBytes(64).toString('hex');
};

export const hashRefreshToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};

/** Check so garbage cookies never cost a database query. */
export const isRefreshTokenShape = (value: string): boolean => {
  return REFRESH_TOKEN_SHAPE.test(value);
};

export const getSessionExpiration = (): Date => {
  return new Date(Date.now() + env.SESSION_LIFETIME_DAYS * 24 * 60 * 60 * 1000);
};
