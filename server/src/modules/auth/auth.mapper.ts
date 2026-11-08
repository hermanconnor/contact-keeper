import type { PublicUserDto, UserDoc } from '@/models/user.model.js';

export const toPublicUser = (user: UserDoc): PublicUserDto => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
