import type { Types, QueryFilter } from 'mongoose';
import {
  Contact,
  type ContactDoc,
  type ContactType,
} from '@/models/contact.model.js';
import type {
  CreateContactInput,
  ListContactsQuery,
  UpdateContactInput,
} from '@/schemas/contact.schema.js';
import { AppError } from '@/utils/AppError.js';
import type { ContactLean } from './contact.types.js';

type ContactFilter = QueryFilter<ContactType>;

// `_id` is the tie-breaker so pagination is stable when the sort field has duplicates.
const SORTS: Record<ListContactsQuery['sort'], Record<string, 1 | -1>> = {
  name: { name: 1, _id: 1 },
  '-name': { name: -1, _id: -1 },
  createdAt: { createdAt: 1, _id: 1 },
  '-createdAt': { createdAt: -1, _id: -1 },
};

const escapeRegex = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const notFound = () => new AppError('Contact not found', 404);

export interface ContactPage {
  contacts: ContactLean[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function listContacts(
  userId: Types.ObjectId | string,
  query: ListContactsQuery,
): Promise<ContactPage> {
  const { page, limit, type, search, sort } = query;

  const filter: ContactFilter = { user: userId };

  if (type) {
    filter.type = type;
  }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }];
  }

  const [contacts, total] = await Promise.all([
    Contact.find(filter)
      .sort(SORTS[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Contact.countDocuments(filter),
  ]);

  return {
    contacts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export function createContact(
  userId: Types.ObjectId | string,
  input: CreateContactInput,
): Promise<ContactDoc> {
  return Contact.create({
    user: userId,
    name: input.name,
    ...(input.email && { email: input.email }),
    ...(input.phone && { phone: input.phone }),
    ...(input.type && { type: input.type }),
  });
}

// Every query below is scoped by `user`, so someone else's contact is indistinguishable
// from one that doesn't exist: both are a 404 and nothing about other users leaks.

export async function getContact(
  userId: Types.ObjectId | string,
  contactId: Types.ObjectId | string,
): Promise<ContactLean> {
  const contact = await Contact.findOne({
    _id: contactId,
    user: userId,
  }).lean();

  if (!contact) throw notFound();

  return contact;
}

export async function updateContact(
  userId: Types.ObjectId | string,
  contactId: Types.ObjectId | string,
  input: UpdateContactInput,
): Promise<ContactLean> {
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, 1> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === null) {
      $unset[key] = 1;
    } else if (value !== undefined) {
      $set[key] = value;
    }
  }

  const contact = await Contact.findOneAndUpdate(
    { _id: contactId, user: userId },
    {
      ...(Object.keys($set).length > 0 ? { $set } : {}),
      ...(Object.keys($unset).length > 0 ? { $unset } : {}),
    },
    { returnDocument: 'after', runValidators: true },
  ).lean();

  if (!contact) throw notFound();

  return contact;
}

export async function deleteContact(
  userId: Types.ObjectId | string,
  contactId: Types.ObjectId | string,
): Promise<void> {
  const { deletedCount } = await Contact.deleteOne({
    _id: contactId,
    user: userId,
  });

  if (deletedCount !== 1) throw notFound();
}
