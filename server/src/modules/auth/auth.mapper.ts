import type { PublicUserDto } from '@/models/user.model.js';

/**
 * Accepts a hydrated document or a lean object (both have these fields) and copies fields
 * explicitly, so `password` and anything added to the schema later never leaks.
 */
export const toPublicUser = (user: PublicUserDto): PublicUserDto => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
