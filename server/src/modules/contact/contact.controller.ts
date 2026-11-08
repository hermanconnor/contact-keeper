import type { Request, Response } from 'express';

export const getContacts = async (req: Request, res: Response) => {
  res.send('GET ALL CONTACTS');
};

export const addContact = async (req: Request, res: Response) => {
  res.send('ADD NEW CONTACT');
};

export const updateContact = async (req: Request, res: Response) => {
  res.send('UPDATE CONTACT');
};

export const deleteContact = async (req: Request, res: Response) => {
  res.send('DELETE CONTACT');
};
