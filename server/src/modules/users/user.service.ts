import type { Types } from 'mongoose';
import { User, type UserDoc } from '@/models/user.model.js';
import { AppError } from '@/utils/AppError.js';
import { RefreshToken } from '@/models/refresh-token.model.js';
import { Contact } from '@/models/contact.model.js';
import type { UpdateProfileInput } from './user.types.js';
import { hashPassword, verifyPassword } from '@/utils/password.js';

// `protect` only verifies the JWT and never touches the database, so an access token
// can outlive its account by up to ACCESS_TTL_SECONDS. A missing user is therefore
// "your credentials are no longer valid" (401), not "resource not found" (404).
const notAuthorized = () => new AppError('Not authorized', 401);

export async function getUserById(
  userId: Types.ObjectId | string,
): Promise<UserDoc> {
  const user = await User.findById(userId);

  if (!user) throw notAuthorized();

  return user;
}

export async function updateUser(
  userId: Types.ObjectId | string,
  input: UpdateProfileInput,
): Promise<UserDoc> {
  // If updating email, check uniqueness across other documents
  if (input.email) {
    const existing = await User.exists({
      email: input.email,
      _id: { $ne: userId },
    });

    if (existing) {
      throw new AppError('User already exists with this email', 409);
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: input },
    { new: true, runValidators: true },
  );

  if (!user) throw notAuthorized();

  return user;
}

/**
 * Changes the password and ends every existing session. The caller is expected to
 * start a fresh session afterwards (see the controller) so the current device stays logged in.
 */
export async function changePassword(
  userId: Types.ObjectId | string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await User.findById(userId).select('+password');

  if (!user) throw notAuthorized();

  // 400, not 401: the frontend treats 401 as "access token expired" and tries to refresh.
  if (!(await verifyPassword(user.password, currentPassword))) {
    throw new AppError('Current password is incorrect', 400);
  }

  await User.updateOne(
    { _id: user._id },
    { password: await hashPassword(newPassword) },
  );

  // After the password is saved, so a failure here can't leave the old password in place
  // with the sessions already gone. Worst case the sessions survive until a retry.
  await RefreshToken.deleteMany({ userId: user._id });
}

/**
 * Permanently deletes the account and everything it owns. No transaction (works on a
 * standalone MongoDB), so the user document goes LAST: if a step fails, the account still
 * exists and the request can simply be retried.
 */
export async function deleteUser(
  userId: Types.ObjectId | string,
  password: string,
): Promise<void> {
  const user = await User.findById(userId).select('+password');

  if (!user) throw notAuthorized();

  if (!(await verifyPassword(user.password, password))) {
    throw new AppError('Password is incorrect', 400);
  }

  await RefreshToken.deleteMany({ userId: user._id });
  await Contact.deleteMany({ user: user._id });
  await User.deleteOne({ _id: user._id });
}
