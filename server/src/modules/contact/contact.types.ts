import type { Request } from 'express';
import type { Types } from 'mongoose';
import type { ContactType } from '@/models/contact.model.js';
import type {
  ContactIdParams,
  CreateContactInput,
  ListContactsQuery,
  UpdateContactInput,
} from '@/schemas/contact.schema.js';

export type ContactLean = ContactType & { _id: Types.ObjectId };

type IdParams = Request['params'] & ContactIdParams;

export type CreateContactRequest = Request<
  Request['params'],
  unknown,
  CreateContactInput
>;

export type ListContactsRequest = Request<
  Request['params'],
  unknown,
  unknown,
  Request['query'] & ListContactsQuery
>;

export type ContactIdRequest = Request<IdParams>;

export type UpdateContactRequest = Request<
  IdParams,
  unknown,
  UpdateContactInput
>;
