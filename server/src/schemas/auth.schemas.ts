import { z } from 'zod';
import { emailSchema, nameSchema, passwordSchema } from './common.schemas.js';

export const registerSchema = z.object({
  body: z.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required').max(128),
  }),
});

export type RegisterInput = z.output<typeof registerSchema>['body'];
export type LoginInput = z.output<typeof loginSchema>['body'];
