import type { ContactDoc, PublicContactDto } from '@/models/contact.model.js';

export const toPublicContact = (contact: ContactDoc): PublicContactDto => ({
  _id: contact._id,
  name: contact.name,
  email: contact.email ?? null,
  phone: contact.phone ?? null,
  type: contact.type,
  date: contact.date,
  createdAt: contact.createdAt,
  updatedAt: contact.updatedAt,
});
