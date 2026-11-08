import type { CookieOptions, Request, Response } from 'express';

export const REFRESH_COOKIE = 'refreshToken';

export const REFRESH_COOKIE_PATH = '/api/v1/auth';

const refreshCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: REFRESH_COOKIE_PATH,
} satisfies CookieOptions;

export function setRefreshCookie(
  res: Response,
  refreshToken: string,
  sessionExpiresAt: Date,
): void {
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...refreshCookieOptions,
    expires: sessionExpiresAt,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
}

export function getRefreshCookie(req: Request): string | undefined {
  const value: unknown = req.cookies?.[REFRESH_COOKIE];

  return typeof value === 'string' && value !== '' ? value : undefined;
}
