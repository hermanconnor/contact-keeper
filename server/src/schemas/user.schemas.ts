import { z } from 'zod';

const name = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters long')
  .max(100, 'Name must be fewer than 100 characters long');

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'Email is too long')
  .pipe(z.email('Please provide a valid email address'));

const newPassword = z
  .string()
  .min(6, 'Password must be at least 6 characters long')
  .max(128, 'Password is too long');

const passwordVerification = z.string().min(1, 'Password is required').max(128);

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: name.optional(),
      email: email.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      error: 'Provide at least one field to update',
    }),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: passwordVerification,
      newPassword,
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: 'New password must be different from the current password',
      path: ['newPassword'],
    }),
});

export const deleteAccountSchema = z.object({
  body: z.object({
    password: passwordVerification,
  }),
});
