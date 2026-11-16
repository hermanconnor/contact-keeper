import mongoose, { type Types } from 'mongoose';
import { User } from '@/models/user.model.js';
import { Contact } from '@/models/contact.model.js';
import { RefreshToken } from '@/models/refresh-token.model.js';
import { env } from '@/config/env.js';
import { hashPassword } from '@/utils/password.js';
import { connectDB, disconnectDB } from '@/config/db.js';

const SEED_PASSWORD = 'Password123!';
const CONTACTS_PER_USER = 15;

const SEED_USERS = [
  { name: 'James Bond', email: 'james.bond@example.com' },
  { name: 'Eve Moneypenny', email: 'eve.moneypenny@example.com' },
  { name: 'Felix Leiter', email: 'felix.leiter@example.com' },
] as const;

const FIRST_NAMES = [
  'James',
  'Felix',
  'Eve',
  'Auric',
  'Francisco',
  'Alec',
  'Franz',
  'Brad',
  'Madeline',
  'Vesper',
  'Honey',
  'Tiffany',
] as const;

const LAST_NAMES = [
  'Bond',
  'Leiter',
  'Moneypenny',
  'Goldfinger',
  'Scaramanga',
  'Trevelyan',
  'Oberhauser',
  'Whitaker',
  'Swann',
  'Lynd',
  'Rider',
  'Case',
] as const;

const pick = <T>(items: readonly T[], index: number): T => {
  return items[index % items.length] as T;
};

interface SeedContact {
  user: Types.ObjectId;
  name: string;
  type: 'personal' | 'professional';
  email?: string;
  phone?: string;
}

/**
 * Deterministic data (no randomness) so every run produces the same contacts. Some
 * contacts deliberately lack an email or a phone, since both are optional.
 */
function buildContacts(
  userId: Types.ObjectId,
  userIndex: number,
): SeedContact[] {
  return Array.from({ length: CONTACTS_PER_USER }, (_, i) => {
    const n = userIndex * CONTACTS_PER_USER + i;
    const first = pick(FIRST_NAMES, n);
    const last = pick(LAST_NAMES, n * 5 + 3);

    const contact: SeedContact = {
      user: userId,
      name: `${first} ${last}`,
      type: i % 3 === 0 ? 'professional' : 'personal',
    };

    if (i % 4 !== 3) {
      contact.email = `${first}.${last}@example.com`.toLowerCase();
    }

    if (i % 5 !== 4) {
      contact.phone = `555-01${String(n % 100).padStart(2, '0')}`;
    }

    return contact;
  });
}

async function clearDatabase(): Promise<void> {
  const [contacts, tokens, users] = await Promise.all([
    Contact.deleteMany({}),
    RefreshToken.deleteMany({}),
    User.deleteMany({}),
  ]);

  console.log(
    `Cleared ${users.deletedCount} users, ${contacts.deletedCount} contacts, ${tokens.deletedCount} refresh tokens`,
  );
}

async function seedDatabase(): Promise<void> {
  // Make sure the unique indexes exist before inserting, even on a brand-new database.
  await Promise.all([User.init(), Contact.init(), RefreshToken.init()]);

  // One hash shared by every demo user: it's the same password, and Argon2 is slow on purpose.
  const password = await hashPassword(SEED_PASSWORD);

  const users = await User.insertMany(
    SEED_USERS.map((user) => ({ ...user, password })),
  );

  const contacts = await Contact.insertMany(
    users.flatMap((user, index) => buildContacts(user._id, index)),
  );

  console.log(`Seeded ${users.length} users and ${contacts.length} contacts`);
  console.log(`\nLog in with any of these (password: ${SEED_PASSWORD}):`);

  for (const { email } of SEED_USERS) {
    console.log(`  ${email}`);
  }
}

async function main(): Promise<void> {
  try {
    if (env.NODE_ENV === 'production') {
      throw new Error('Refusing to seed or clear a production database');
    }

    const clearOnly = process.argv.includes('--clear');

    await connectDB();
    console.log(`Connected to "${mongoose.connection.name}"`);

    await clearDatabase();

    if (!clearOnly) await seedDatabase();
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

main();
