import { z } from 'zod';

const emailField = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .toLowerCase()
  .max(254, 'Email is too long')
  .pipe(z.email('Please enter a valid email address'));

export const loginSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password is too long'),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be fewer than 100 characters'),
    email: emailField,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    error: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.output<typeof loginSchema>;
export type RegisterFormValues = z.output<typeof registerSchema>;

/** What the API receives: the confirmation field never leaves the browser. */
export type LoginInput = LoginFormValues;
export type RegisterInput = Omit<RegisterFormValues, 'confirmPassword'>;

// ------------------------------------------------------------------
// API responses (validated at runtime, so a surprise shape fails loudly here, not deep in the UI)
// ------------------------------------------------------------------
export const userSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const tokenResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(),
});

export const authResponseSchema = tokenResponseSchema.extend({
  user: userSchema,
});

export const currentUserResponseSchema = z.object({ user: userSchema });

export type User = z.infer<typeof userSchema>;
