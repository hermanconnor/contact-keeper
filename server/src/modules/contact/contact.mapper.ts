import type { PublicContactDto } from '@/models/contact.model.js';

/**
 * Accepts a hydrated document or a lean object (both have these fields) and copies
 * fields explicitly, so `user`, `__v` and anything added to the schema later never leak.
 */
export const toPublicContact = (
  contact: PublicContactDto,
): PublicContactDto => ({
  _id: contact._id,
  name: contact.name,
  email: contact.email ?? null,
  phone: contact.phone ?? null,
  type: contact.type,
  date: contact.date,
  createdAt: contact.createdAt,
  updatedAt: contact.updatedAt,
});
