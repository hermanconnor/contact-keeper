import mongoose from 'mongoose';
import { env } from './env.js';
import logger from '@/utils/logger.js';

// Throw on unknown filter keys instead of silently dropping them: a typo like { usr: id }
// would otherwise widen a query (or a delete) to every document.
mongoose.set('strictQuery', 'throw');

mongoose.connection.on('connected', () => {
  logger.info(`✅ MongoDB connected to: ${mongoose.connection.name}`);
});

mongoose.connection.on('error', (err: unknown) => {
  logger.error({ err }, '❌ MongoDB connection error');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️ MongoDB disconnected.');
});

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 2000;
const PING_TIMEOUT_MS = 2000;

/**
 * Connects with exponential backoff. Throws once the retries are used up, so the caller
 * decides what to do (the server logs and exits, the seed script reports and exits).
 *
 * Indexes are built automatically (Mongoose's default): the unique email index and the
 * refresh-token TTL index are part of how the auth module works.
 */
export const connectDB = async (retryCount = 0): Promise<void> => {
  if (mongoose.connection.readyState >= 1) return;

  try {
    await mongoose.connect(env.DATABASE_URL, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  } catch (error) {
    if (retryCount >= MAX_RETRIES) {
      throw new Error(
        `Initial MongoDB connection failed after ${MAX_RETRIES} retries`,
        { cause: error },
      );
    }

    const delay = INITIAL_RETRY_DELAY * 2 ** retryCount; // Exponential backoff

    logger.warn(
      `⚠️ Connection failed. Retrying in ${delay / 1000}s... (${retryCount + 1}/${MAX_RETRIES})`,
    );

    await new Promise((resolve) => setTimeout(resolve, delay));

    return connectDB(retryCount + 1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) return;

  try {
    await mongoose.disconnect();
    logger.info('✅ MongoDB connection closed successfully');
  } catch (error) {
    logger.error({ err: error }, '❌ Error during MongoDB disconnection');
  }
};

/** Rejects if `promise` hasn't settled within `ms`. */
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

/**
 * Pings the server to make sure the connection is actually responsive. Bounded by a short
 * timeout so a hung database can't hold a health check open until the socket times out.
 */
export const testConnection = async (): Promise<boolean> => {
  const db = mongoose.connection.db;

  if (mongoose.connection.readyState !== 1 || !db) return false;

  try {
    await withTimeout(db.admin().ping(), PING_TIMEOUT_MS);

    return true;
  } catch (error) {
    logger.warn({ err: error }, '⚠️ Database health check failed');

    return false;
  }
};
