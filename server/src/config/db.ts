import mongoose from 'mongoose';
import { env } from './env.js';
import logger from '@/utils/logger.js';

mongoose.set('strictQuery', true);

mongoose.connection.on('connected', () => {
  logger.info(`✅ MongoDB connected to: ${mongoose.connection.name}`);
});

mongoose.connection.on('error', (err) => {
  logger.error(`❌ MongoDB connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️ MongoDB disconnected.');
});

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 2000;

export const connectDB = async (retryCount = 0): Promise<void> => {
  const dbUrl = env.DATABASE_URL;

  try {
    if (mongoose.connection.readyState >= 1) return;

    await mongoose.connect(dbUrl, {
      autoIndex: env.NODE_ENV !== 'production',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff

      logger.warn(
        `⚠️ Connection failed. Retrying in ${delay / 1000}s... (${retryCount + 1}/${MAX_RETRIES})`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));

      return connectDB(retryCount + 1);
    }

    logger.error(
      `❌ Maximum retries reached. Initial MongoDB connection failed: ${error}`,
    );
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) return;

  try {
    await mongoose.disconnect();
    logger.info('✅ MongoDB connection closed successfully');
  } catch (error) {
    logger.error(`❌ Error during MongoDB disconnection: ${error}`);
  }
};

export const testConnection = async (): Promise<boolean> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return false;
    }

    // Pings the server to ensure the connection is actually responsive
    const db = mongoose.connection.db;
    if (!db) return false;

    await db.admin().ping();

    return true;
  } catch (error) {
    logger.error(`❌ Health check failed: ${error}`);
    return false;
  }
};
