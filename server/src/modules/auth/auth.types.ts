import type { Request } from 'express';
import type { LoginInput, RegisterInput } from '@/schemas/auth.schemas.js';

export type RegisterRequest = Request<
  Request['params'],
  unknown,
  RegisterInput
>;
export type LoginRequest = Request<Request['params'], unknown, LoginInput>;
