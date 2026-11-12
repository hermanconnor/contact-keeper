import { z } from 'zod';
import { emailSchema, nameSchema, passwordSchema } from './common.schemas.js';

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: nameSchema.optional(),
      email: emailSchema.optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'Provide at least one field to update',
    }),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z
        .string()
        .min(1, 'Current password is required')
        .max(128),
      newPassword: passwordSchema,
    })
    .refine((body) => body.currentPassword !== body.newPassword, {
      message: 'New password must be different from the current password',
      path: ['newPassword'],
    }),
});

export const deleteAccountSchema = z.object({
  body: z.object({
    password: z.string().min(1, 'Password is required').max(128),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>['body'];
