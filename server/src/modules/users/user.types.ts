import type { Request } from 'express';
import { z } from 'zod';
import type {
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from '@/schemas/user.schemas.js';

type BodyRequest<Body> = Request<Request['params'], unknown, Body>;

export type UpdateProfileInput = z.output<typeof updateProfileSchema>['body'];
export type ChangePasswordInput = z.output<typeof changePasswordSchema>['body'];
export type DeleteAccountInput = z.output<typeof deleteAccountSchema>['body'];

export type UpdateProfileRequest = BodyRequest<UpdateProfileInput>;
export type ChangePasswordRequest = BodyRequest<ChangePasswordInput>;
export type DeleteAccountRequest = BodyRequest<DeleteAccountInput>;
