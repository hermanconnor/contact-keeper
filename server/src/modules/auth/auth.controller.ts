import type { Request, Response } from 'express';

export const registerUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  res.send('REGISTERS A USER');
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  res.send('LOGS IN A USER');
};

export const logoutUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  res.send('LOGS OUT A USER');
};

export const refreshAccessToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  res.send('REFRESH TOKENS');
};
