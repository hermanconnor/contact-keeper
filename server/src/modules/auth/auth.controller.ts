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
import { createAuthTokens } from './auth.service.js';
import { sendAuthResponse } from './auth.utils.js';
import { toPublicUser } from './auth.mapper.js';

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
  res.send('LOG OUT USER');
};

export const refreshAccessToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  res.send('REFRESH TOKENS');
};
