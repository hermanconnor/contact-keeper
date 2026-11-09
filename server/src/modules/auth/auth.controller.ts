import type { Request, Response } from 'express';
import type { LoginRequest, RegisterRequest } from './auth.types.js';
import { User } from '@/models/user.model.js';
import { AppError } from '@/utils/AppError.js';
import {
  hashPassword,
  needsRehash,
  verifyDummyPassword,
  verifyPassword,
} from '@/utils/password.js';
import {
  createAuthTokens,
  refreshAuthTokens,
  revokeAuthTokens,
} from './auth.service.js';
import { sendAuthResponse } from './auth.utils.js';
import { toPublicUser } from './auth.mapper.js';
import {
  clearRefreshCookie,
  getRefreshCookie,
  setRefreshCookie,
} from '@/utils/cookies.js';
import { ACCESS_TTL_SECONDS } from '@/utils/tokens.js';

export const registerUser = async (
  req: RegisterRequest,
  res: Response,
): Promise<void> => {
  const { name, email, password } = req.body;

  if (await User.exists({ email })) {
    throw new AppError('User already exists with this email', 409);
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const { accessToken, refreshToken, sessionExpiresAt } =
    await createAuthTokens(user._id);

  sendAuthResponse(res, 201, accessToken, refreshToken, sessionExpiresAt, {
    user: toPublicUser(user),
  });
};

export const loginUser = async (
  req: LoginRequest,
  res: Response,
): Promise<void> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  const valid = user
    ? await verifyPassword(user.password, password)
    : await verifyDummyPassword(password);

  if (!user || !valid) throw new AppError('Invalid credentials', 401);

  if (needsRehash(user.password)) {
    await User.updateOne(
      { _id: user._id },
      { password: await hashPassword(password) },
    );
  }

  const { accessToken, refreshToken, sessionExpiresAt } =
    await createAuthTokens(user._id);

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

  if (!token) throw new AppError('Refresh token missing', 401);

  try {
    const result = await refreshAuthTokens(token);

    res.set({ 'Cache-Control': 'no-store', Pragma: 'no-cache' });

    if (result.kind === 'rotated') {
      setRefreshCookie(res, result.refreshToken, result.sessionExpiresAt);

      res.status(200).json({
        success: true,
        tokenType: 'Bearer',
        expiresIn: ACCESS_TTL_SECONDS,
        accessToken: result.accessToken,
        message: 'Token refreshed successfully',
      });
    } else {
      // Parallel request delivered the new refresh token; keep existing cookie
      res.status(200).json({
        success: true,
        tokenType: 'Bearer',
        expiresIn: ACCESS_TTL_SECONDS,
        accessToken: result.accessToken,
        message: 'Token refreshed successfully',
      });
    }
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 401) {
      clearRefreshCookie(res);
    }

    throw error;
  }
};
