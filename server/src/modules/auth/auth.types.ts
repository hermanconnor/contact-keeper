import type { Request } from 'express';
import type { z } from 'zod';
import type { loginSchema, registerSchema } from '@/schemas/auth.schema.js';

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;

export type RegisterRequest = Request<Request['params'], unknown, RegisterBody>;
export type LoginRequest = Request<Request['params'], unknown, LoginBody>;
