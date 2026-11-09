import type { CookieOptions, Request, Response } from 'express';
import { isRefreshTokenShape } from './tokens.js';

export const REFRESH_COOKIE = 'refreshToken';

/** The refresh cookie is only sent to the auth routes. Must match where the auth router is mounted. */
export const REFRESH_COOKIE_PATH = '/api/v1/auth';

const refreshCookieOptions = {
  httpOnly: true,
  // Cross-site cookies (Netlify -> Render) require secure: true and sameSite: 'none'
  secure: true,
  sameSite: 'none',
  // CHIPS: the cookie is stored per top-level site and is only sent when that
  // site is the page making the request. Safari 26.2+ and Chrome Incognito refuse an unpartitioned
  // cross-site cookie, and it also means pages on other sites can't make the browser send it.
  // Browsers without CHIPS still accept it as a normal SameSite=None cookie where 3rd-party cookies are allowed.
  partitioned: true,
  path: REFRESH_COOKIE_PATH,
} satisfies CookieOptions;

export function setRefreshCookie(
  res: Response,
  refreshToken: string,
  sessionExpiresAt: Date,
): void {
  // Expires with the (fixed) session, so the cookie never outlives its server-side record
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...refreshCookieOptions,
    expires: sessionExpiresAt,
  });
}

/** Must use the same attributes (including path, sameSite and partitioned) when clearing cookies. */
export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
}

/** Reads the refresh token cookie if it is a well-formed string, so junk never costs a database query. */
export function getRefreshCookie(req: Request): string | undefined {
  const value: unknown = req.cookies?.[REFRESH_COOKIE];
  return typeof value === 'string' && isRefreshTokenShape(value)
    ? value
    : undefined;
}
