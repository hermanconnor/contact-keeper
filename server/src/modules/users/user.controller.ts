import type { Request, Response } from 'express';
import {
  changePassword,
  deleteUser,
  getUserById,
  updateUser,
} from './user.service.js';
import { toPublicUser } from '../auth/auth.mapper.js';
import { requireUserId } from '@/middleware/auth.js';
import type {
  ChangePasswordRequest,
  DeleteAccountRequest,
  UpdateProfileRequest,
} from './user.types.js';
import { createAuthTokens } from '../auth/auth.service.js';
import { sendAuthResponse } from '../auth/auth.utils.js';
import { clearRefreshCookie } from '@/utils/cookies.js';

export const getMe = async (req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req);
  const user = await getUserById(userId);

  res.status(200).json({ success: true, user: toPublicUser(user) });
};

export const updateMe = async (
  req: UpdateProfileRequest,
  res: Response,
): Promise<void> => {
  const userId = requireUserId(req);

  const user = await updateUser(userId, req.body);

  res.status(200).json({ success: true, user: toPublicUser(user) });
};

export const changeMyPassword = async (
  req: ChangePasswordRequest,
  res: Response,
): Promise<void> => {
  const userId = requireUserId(req);

  const { currentPassword, newPassword } = req.body;

  await changePassword(userId, currentPassword, newPassword);

  // Every session was just revoked; start a new one so this device stays logged in.
  const { accessToken, refreshToken, sessionExpiresAt } =
    await createAuthTokens(userId);

  sendAuthResponse(res, 200, accessToken, refreshToken, sessionExpiresAt, {
    message: 'Password updated successfully',
  });
};

export const deleteMe = async (
  req: DeleteAccountRequest,
  res: Response,
): Promise<void> => {
  const userId = requireUserId(req);

  const { password } = req.body;

  await deleteUser(userId, password);

  clearRefreshCookie(res);

  res.status(200).json({ success: true, message: 'Account deleted' });
};
