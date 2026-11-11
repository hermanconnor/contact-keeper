import { z } from 'zod';

const id = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid contact id');

const name = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must be fewer than 100 characters long');

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'Email is too long')
  .pipe(z.email('Please provide a valid email address'));

const phone = z
  .string()
  .trim()
  .regex(/^[+\d\s().-]{3,30}$/, 'Invalid phone number');

const type = z.enum(['personal', 'professional']);

const SORT_OPTIONS = ['name', '-name', 'createdAt', '-createdAt'] as const;

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
    email: email.optional(),
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
      email: email.nullable().optional(),
      phone: phone.nullable().optional(),
      type: type.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Provide at least one field to update',
    }),
});

export type ContactIdParams = z.output<typeof contactIdSchema>['params'];
export type ListContactsQuery = z.output<typeof listContactsSchema>['query'];
export type CreateContactInput = z.output<typeof createContactSchema>['body'];
export type UpdateContactInput = z.output<typeof updateContactSchema>['body'];
