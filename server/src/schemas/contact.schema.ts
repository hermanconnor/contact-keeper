import { z } from 'zod';
import { emailSchema } from './common.schemas.js';

const id = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid contact id');

const name = z.string().trim().min(1).max(100);

const phone = z
  .string()
  .trim()
  .regex(/^[+\d\s().-]{3,30}$/, 'Invalid phone number');

const type = z.enum(['personal', 'professional']);

export const SORT_OPTIONS = [
  'name',
  '-name',
  'createdAt',
  '-createdAt',
] as const;

export const contactIdSchema = z.object({
  params: z.object({ id }),
});

export const listContactsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: type.optional(),
    search: z.string().trim().min(1).max(100).optional(),
    sort: z.enum(SORT_OPTIONS).default('name'),
  }),
});

export const createContactSchema = z.object({
  body: z.object({
    name,
    email: emailSchema.optional(),
    phone: phone.optional(),
    type: type.optional(),
  }),
});

export const updateContactSchema = z.object({
  params: z.object({ id }),
  // `null` clears an optional field (email / phone); omitting a key leaves it untouched.
  body: z
    .object({
      name: name.optional(),
      email: emailSchema.nullable().optional(),
      phone: phone.nullable().optional(),
      type: type.optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'Provide at least one field to update',
    }),
});

export type ContactIdParams = z.infer<typeof contactIdSchema>['params'];
export type ListContactsQuery = z.infer<typeof listContactsSchema>['query'];
export type CreateContactInput = z.infer<typeof createContactSchema>['body'];
export type UpdateContactInput = z.infer<typeof updateContactSchema>['body'];
