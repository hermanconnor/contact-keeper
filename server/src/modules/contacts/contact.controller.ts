import type { Response } from 'express';
import type {
  ContactIdRequest,
  CreateContactRequest,
  ListContactsRequest,
  UpdateContactRequest,
} from './contact.types.js';
import * as contactService from './contact.service.js';
import { requireUserId } from '@/middleware/auth.js';
import { toPublicContact } from './contact.mapper.js';

export const listContacts = async (
  req: ListContactsRequest,
  res: Response,
): Promise<void> => {
  const userId = requireUserId(req);

  const { contacts, pagination } = await contactService.listContacts(
    userId,
    req.query,
  );

  res.status(200).json({
    success: true,
    contacts: contacts.map(toPublicContact),
    pagination,
  });
};

export const createContact = async (
  req: CreateContactRequest,
  res: Response,
): Promise<void> => {
  const userId = requireUserId(req);

  const contact = await contactService.createContact(userId, req.body);

  res.status(201).json({ success: true, contact: toPublicContact(contact) });
};

export const getContact = async (
  req: ContactIdRequest,
  res: Response,
): Promise<void> => {
  const userId = requireUserId(req);
  const { id } = req.params;

  const contact = await contactService.getContact(userId, id);

  res.status(200).json({ success: true, contact: toPublicContact(contact) });
};

export const updateContact = async (
  req: UpdateContactRequest,
  res: Response,
): Promise<void> => {
  const userId = requireUserId(req);
  const { id } = req.params;

  const contact = await contactService.updateContact(userId, id, req.body);

  res.status(200).json({ success: true, contact: toPublicContact(contact) });
};

export const deleteContact = async (req: ContactIdRequest, res: Response) => {
  const userId = requireUserId(req);
  const { id } = req.params;

  await contactService.deleteContact(userId, id);

  res.status(200).json({ success: true, message: 'Contact deleted' });
};
