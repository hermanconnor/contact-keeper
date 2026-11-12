import type { Request, Response } from 'express';
import type { LoginRequest, RegisterRequest } from './auth.types.js';
import { AppError } from '@/utils/AppError.js';
import {
  clearRefreshCookie,
  getRefreshCookie,
  REFRESH_COOKIE,
} from '@/utils/cookies.js';
import {
  refreshAuthTokens,
  revokeAuthTokens,
  signIn,
  signUp,
} from './auth.service.js';
import { sendAccessToken, sendAuthResponse } from './auth.utils.js';
import { toPublicUser } from './auth.mapper.js';

export const registerUser = async (
  req: RegisterRequest,
  res: Response,
): Promise<void> => {
  const { user, accessToken, refreshToken, sessionExpiresAt } = await signUp(
    req.body,
  );

  sendAuthResponse(res, 201, accessToken, refreshToken, sessionExpiresAt, {
    user: toPublicUser(user),
  });
};

export const loginUser = async (
  req: LoginRequest,
  res: Response,
): Promise<void> => {
  const { user, accessToken, refreshToken, sessionExpiresAt } = await signIn(
    req.body,
  );

  sendAuthResponse(res, 200, accessToken, refreshToken, sessionExpiresAt, {
    user: toPublicUser(user),
  });
};

export const logoutUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const token = getRefreshCookie(req);

  if (token) {
    await revokeAuthTokens(token);
  }

  clearRefreshCookie(res);

  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const token = getRefreshCookie(req);

  if (!token) {
    // A malformed cookie is ignored by getRefreshCookie; drop it so the browser stops sending it.
    if (req.cookies?.[REFRESH_COOKIE] !== undefined) {
      clearRefreshCookie(res);
    }

    throw new AppError('Refresh token missing', 401);
  }

  try {
    const result = await refreshAuthTokens(token);
    const extra = { message: 'Token refreshed successfully' };

    if (result.kind === 'rotated') {
      sendAuthResponse(
        res,
        200,
        result.accessToken,
        result.refreshToken,
        result.sessionExpiresAt,
        extra,
      );
    } else {
      // A parallel request is delivering the new refresh token; keep the existing cookie.
      sendAccessToken(res, 200, result.accessToken, extra);
    }
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 401) {
      clearRefreshCookie(res);
    }

    throw error;
  }
};
