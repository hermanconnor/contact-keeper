import type { Request, Response } from 'express';

export const getMe = async (req: Request, res: Response) => {
  res.send('GET AUTHENTICATED USER');
};

export const updateUser = async (req: Request, res: Response) => {
  res.send('UPDATE USER');
};

export const deleteUser = async (req: Request, res: Response) => {
  res.send('DELETE USER');
};
