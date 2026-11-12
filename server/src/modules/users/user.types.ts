import type { Request } from 'express';
import type {
  UpdateProfileInput,
  ChangePasswordInput,
  DeleteAccountInput,
} from '@/schemas/user.schemas.js';

type BodyRequest<Body> = Request<Request['params'], unknown, Body>;

export type UpdateProfileRequest = BodyRequest<UpdateProfileInput>;
export type ChangePasswordRequest = BodyRequest<ChangePasswordInput>;
export type DeleteAccountRequest = BodyRequest<DeleteAccountInput>;
