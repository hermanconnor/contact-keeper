import { randomUUID } from 'node:crypto';
import type { Types } from 'mongoose';
import { RefreshToken, type TokenDoc } from '@/models/refresh-token.model.js';
import { AppError } from '@/utils/AppError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  getSessionExpiration,
  hashRefreshToken,
} from '@/utils/tokens.js';
import logger from '@/utils/logger.js';

// A request presenting the token that was rotated less than this long ago is a parallel
// refresh (two tabs, several requests getting a 401 at once), not theft.
const REUSE_WINDOW_MS = 10_000;

// Rotated tokens are kept this long so a replay is still recognised as theft; after that
// the TTL index deletes them (a replay is then just "invalid"). Without this, every
// rotation would stay in the database until the whole session expires.
const ROTATED_RETENTION_MS = 24 * 60 * 60 * 1000;

export interface AuthTokensResult {
  accessToken: string;
  refreshToken: string;
  sessionExpiresAt: Date;
}

export type RefreshResult =
  | ({ kind: 'rotated' } & AuthTokensResult)
  | { kind: 'parallel'; accessToken: string };

export async function createAuthTokens(
  userId: Types.ObjectId | string,
): Promise<AuthTokensResult> {
  const refreshToken = generateRefreshToken();
  const sessionExpiresAt = getSessionExpiration();

  await RefreshToken.create({
    userId,
    familyId: randomUUID(),
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: sessionExpiresAt,
  });

  return {
    accessToken: generateAccessToken(userId),
    refreshToken,
    sessionExpiresAt,
  };
}

/**
 * Rotates a refresh token. Every step is a single-document atomic operation (no
 * transaction needed, so it also works on a standalone MongoDB), ordered so that a
 * crash or database error can never leave the user without a working token.
 */
export async function refreshAuthTokens(
  presentedToken: string,
): Promise<RefreshResult> {
  const now = new Date();
  const current = await RefreshToken.findOne({
    tokenHash: hashRefreshToken(presentedToken),
  });

  // Unknown or expired: no side effects, so garbage can never revoke anyone's session.
  if (!current || current.expiresAt <= now) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  // Already used: rotated earlier, or revoked by logout / a theft alarm.
  if (current.replacedBy || current.revokedAt) {
    return handleUsedToken(current, now);
  }

  const nextToken = generateRefreshToken();
  const nextHash = hashRefreshToken(nextToken);

  // 1. Create the successor FIRST. If anything below fails, the old token still works.
  await RefreshToken.create({
    userId: current.userId,
    familyId: current.familyId,
    tokenHash: nextHash,
    expiresAt: current.expiresAt, // the session's fixed expiry: rotation never extends it
  });

  // 2. Consume the old token. Atomic compare-and-swap: only one request can win.
  const { matchedCount } = await RefreshToken.updateOne(
    { _id: current._id, revokedAt: null, replacedBy: null },
    {
      $set: {
        revokedAt: now,
        replacedBy: nextHash,
        expiresAt: new Date(
          Math.min(
            current.expiresAt.getTime(),
            now.getTime() + ROTATED_RETENTION_MS,
          ),
        ),
      },
    },
  );

  if (matchedCount !== 1) {
    // Lost the race to a parallel request (or the family was revoked meanwhile).
    // Drop our successor and judge this token as a replay.
    try {
      await RefreshToken.deleteOne({ tokenHash: nextHash });
    } catch {
      // Best effort: nobody ever received that token, and it expires on its own.
    }
    const latest = await RefreshToken.findById(current._id);
    if (!latest) throw new AppError('Invalid or expired refresh token', 401);

    return handleUsedToken(latest, now);
  }

  return {
    kind: 'rotated',
    accessToken: generateAccessToken(current.userId),
    refreshToken: nextToken,
    sessionExpiresAt: current.expiresAt,
  };
}

/** Ends the login this token belongs to. Database errors propagate. */
export async function revokeAuthTokens(presentedToken: string): Promise<void> {
  const token = await RefreshToken.findOne({
    tokenHash: hashRefreshToken(presentedToken),
  });

  if (token) await revokeFamily(token.familyId, new Date());
}

async function handleUsedToken(
  token: TokenDoc,
  now: Date,
): Promise<RefreshResult> {
  // Revoked by logout or an earlier theft alarm (never rotated): the session is simply over.
  if (!token.replacedBy) {
    throw new AppError('Session expired. Please log in again.', 401);
  }

  // Rotated a moment ago by a parallel request: not theft. The winning request delivers the
  // new refresh token, so this one only needs a fresh access token.
  const rotatedAt = token.revokedAt;
  if (
    rotatedAt &&
    now.getTime() - rotatedAt.getTime() <= REUSE_WINDOW_MS &&
    (await familyIsActive(token.familyId))
  ) {
    return { kind: 'parallel', accessToken: generateAccessToken(token.userId) };
  }

  // Otherwise an old token is being replayed: assume it was stolen and end this login.
  await revokeFamily(token.familyId, now);

  // This is the signal that a refresh token may have been stolen.
  logger.warn(
    `[auth] refresh token reuse: user ${token.userId}, family ${token.familyId}`,
  );

  throw new AppError(
    'Session revoked due to security policy. Please log in again.',
    401,
  );
}

async function familyIsActive(familyId: string): Promise<boolean> {
  return (await RefreshToken.exists({ familyId, revokedAt: null })) !== null;
}

// Rotated tokens keep their own revokedAt (their rotation time); only live ones are revoked.
function revokeFamily(familyId: string, at: Date) {
  return RefreshToken.updateMany(
    { familyId, revokedAt: null },
    { $set: { revokedAt: at } },
  );
}
