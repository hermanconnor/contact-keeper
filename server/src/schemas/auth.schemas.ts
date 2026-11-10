import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters long')
      .max(100, 'Name must be fewer than 100 characters long'),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(254, 'Email is too long')
      .pipe(z.email('Please provide a valid email address')),

    password: z
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .max(128, 'Password is too long'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email('Please provide a valid email address')),

    password: z.string().min(1, 'Password is required').max(128),
  }),
});
