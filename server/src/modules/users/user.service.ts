import { Contact } from '@/models/contact.model.js';
import { User, type UserLean } from '@/models/user.model.js';
import type { UpdateProfileInput } from '@/schemas/user.schemas.js';
import { AppError } from '@/utils/AppError.js';
import { hashPassword, verifyPassword } from '@/utils/password.js';
import { revokeAllSessions } from '../auth/auth.service.js';

// `protect` only verifies the JWT and never touches the database, so an access token
// can outlive its account by up to ACCESS_TTL_SECONDS. A missing user is therefore
// "your credentials are no longer valid" (401), not "resource not found" (404).
const notAuthorized = () => new AppError('Not authorized', 401);

export async function getUserById(userId: string): Promise<UserLean> {
  const user = await User.findById(userId).lean<UserLean>();

  if (!user) throw notAuthorized();

  return user;
}

/**
 * Updates the caller's own profile. A taken email surfaces as a Mongo duplicate-key
 * error, which `errorHandler` already turns into a 409.
 */
export async function updateUser(
  userId: string,
  input: UpdateProfileInput,
): Promise<UserLean> {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: input },
    { returnDocument: 'after', runValidators: true },
  ).lean<UserLean>();

  if (!user) throw notAuthorized();

  return user;
}

/**
 * Changes the password and ends every existing session. The caller is expected to
 * start a fresh session afterwards (see the controller) so the current device stays logged in.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await User.findById(userId).select('+password').lean<UserLean>();

  if (!user) throw notAuthorized();

  if (!(await verifyPassword(user.password, currentPassword))) {
    throw new AppError('Current password is incorrect', 400);
  }

  await User.updateOne(
    { _id: user._id },
    { password: await hashPassword(newPassword) },
  );

  // After the password is saved, so a failure here can't leave the old password in place
  // with the sessions already gone. Worst case the sessions survive until a retry.
  await revokeAllSessions(user._id);
}

/**
 * Permanently deletes the account and everything it owns. No transaction (works on a
 * standalone MongoDB), so the user document goes LAST: if a step fails, the account still
 * exists and the request can simply be retried.
 */
export async function deleteUser(
  userId: string,
  password: string,
): Promise<void> {
  const user = await User.findById(userId).select('+password').lean<UserLean>();

  if (!user) throw notAuthorized();

  if (!(await verifyPassword(user.password, password))) {
    throw new AppError('Password is incorrect', 400);
  }

  await revokeAllSessions(user._id);
  await Contact.deleteMany({ user: user._id });
  await User.deleteOne({ _id: user._id });
}
