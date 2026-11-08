import type { Response } from 'express';
import { setRefreshCookie } from '@/utils/cookies.js';
import { ACCESS_TTL_SECONDS } from '@/utils/tokens.js';

/**
 * Token responses must never be cached by browsers or intermediaries (RFC 6749 section 5.1).
 * Sets the refresh cookie and sends back the access token with standard OAuth metadata.
 */
export function sendAuthResponse(
  res: Response,
  status: number,
  accessToken: string,
  refreshToken: string,
  sessionExpiresAt: Date,
  additionalData: Record<string, unknown> = {},
): void {
  // 1. Secure the cookie
  setRefreshCookie(res, refreshToken, sessionExpiresAt);

  // 2. Prevent caching of sensitive token payloads
  res.set({ 'Cache-Control': 'no-store', Pragma: 'no-cache' });

  // 3. Respond with standard OAuth structure
  res.status(status).json({
    success: true,
    tokenType: 'Bearer',
    expiresIn: ACCESS_TTL_SECONDS,
    accessToken,
    ...additionalData,
  });
}
