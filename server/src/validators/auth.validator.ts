import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters long')
      .max(70, 'Name must be fewer than 70 characters long')
      .trim(),
    email: z
      .email('Please provide a valid email address')
      .max(254, 'Email is too long')
      .lowercase()
      .trim(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .max(100, 'Password is too long'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
