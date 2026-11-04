import type { Server } from 'node:http';
import app from '@/app.js';
import { connectDB } from '@/config/db.js';
import { env } from '@/config/env.js';
import logger from '@/utils/logger.js';

let server: Server;

const startServer = async () => {
  try {
    logger.info('Connecting to database...');
    await connectDB();

    server = app.listen(env.PORT, () => {
      logger.info(`Server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    logger.fatal({ err: error }, '❌ Failed to start server');
    process.exit(1);
  }
};

startServer();
