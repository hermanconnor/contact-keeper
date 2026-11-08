import type { Request, Response } from 'express';
import type { RegisterRequest } from './auth.types.js';
import { User } from '@/models/user.model.js';
import { AppError } from '@/utils/AppError.js';
import { hashPassword } from '@/utils/password.js';
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

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  res.send('LOGS IN A USER');
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
