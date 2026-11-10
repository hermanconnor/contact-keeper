import type { Request, Response } from 'express';

export const getMe = async (req: Request, res: Response) => {
  res.send('GET AUTHENTICATED USER');
};

export const updateMe = async (req: Request, res: Response) => {
  res.send('UPDATE USER');
};

export const deleteMe = async (req: Request, res: Response) => {
  res.send('DELETE USER');
};
