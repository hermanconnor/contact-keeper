import type { Response } from 'express';
import { setRefreshCookie } from '@/utils/cookies.js';
import { ACCESS_TTL_SECONDS } from '@/utils/tokens.js';

/**
 * Sends the access token with standard OAuth metadata. Token responses must never be
 * cached by browsers or intermediaries (RFC 6749 section 5.1).
 */
export function sendAccessToken(
  res: Response,
  status: number,
  accessToken: string,
  additionalData: Record<string, unknown> = {},
): void {
  res.set({ 'Cache-Control': 'no-store', Pragma: 'no-cache' });

  res.status(status).json({
    success: true,
    tokenType: 'Bearer',
    expiresIn: ACCESS_TTL_SECONDS,
    accessToken,
    ...additionalData,
  });
}

/** Sets the refresh cookie, then sends the access token. */
export function sendAuthResponse(
  res: Response,
  status: number,
  accessToken: string,
  refreshToken: string,
  sessionExpiresAt: Date,
  additionalData: Record<string, unknown> = {},
): void {
  setRefreshCookie(res, refreshToken, sessionExpiresAt);

  sendAccessToken(res, status, accessToken, additionalData);
}
