import { randomBytes } from 'node:crypto';
import argon2, { type HashOptions } from 'argon2';

// OWASP's minimum for Argon2id: 19 MiB, 2 passes, 1 lane. Raise memoryCost/timeCost
// until one hash takes ~100-250 ms on your production hardware.
const OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} satisfies HashOptions;

export const hashPassword = (plain: string): Promise<string> => {
  return argon2.hash(plain, OPTIONS);
};

export const verifyPassword = (
  hash: string,
  plain: string,
): Promise<boolean> => {
  return argon2.verify(hash, plain);
};

/** True if the hash was made with different parameters: re-hash on the next successful login. */
export const needsRehash = (hash: string): boolean => {
  return argon2.needsRehash(hash, OPTIONS);
};

let dummyHash: Promise<string> | undefined;

/**
 * For emails that don't exist: burns the same time as a real verification so response
 * time doesn't reveal which emails are registered. Always resolves to false.
 */
export async function verifyDummyPassword(plain: string): Promise<false> {
  dummyHash ??= hashPassword(randomBytes(16).toString('hex'));

  await argon2.verify(await dummyHash, plain);

  return false;
}
