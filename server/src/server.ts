import type { Server } from 'node:http';
import app from '@/app.js';
import { connectDB, disconnectDB } from '@/config/db.js';
import { env } from '@/config/env.js';
import logger from '@/utils/logger.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

let server: Server | undefined;
let isShuttingDown = false;

const gracefulShutdown = async (
  signal: string,
  exitCode = 0,
): Promise<void> => {
  // Prevent duplicate execution if multiple signals/errors fire at once
  if (isShuttingDown) return;

  isShuttingDown = true;

  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Forcefully exit if the shutdown process takes longer than the timeout threshold
  const forceExitTimer = setTimeout(() => {
    logger.error(
      '⚠️ Graceful shutdown timed out. Forcefully terminating process.',
    );

    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  forceExitTimer.unref();

  try {
    // 1. Stop accepting new HTTP connections and wait for in-flight requests to finish
    if (server) {
      const httpServer = server;

      await new Promise<void>((resolve, reject) => {
        httpServer.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });

        // Idle keep-alive connections would otherwise hold close() open until the
        // force-exit timer fires (Node 19+ does this itself; older versions don't).
        httpServer.closeIdleConnections();
      });

      logger.info('✅ HTTP server closed. In-flight requests finished.');
    }

    // 2. Disconnect database connection pool / sessions
    await disconnectDB();

    logger.info('✅ Database connections closed gracefully.');
    logger.info('👋 Process shutdown complete. Exiting.');

    // Crash handlers pass 1 so you can see a failure, not a clean exit.
    process.exit(exitCode);
  } catch (error) {
    logger.fatal(
      { err: error },
      '❌ Error encountered during graceful shutdown.',
    );

    process.exit(1);
  }
};

// ---------------------------------------------------------
//  Register Process Listeners Immediately (Top Level)
// ---------------------------------------------------------
process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err: Error) => {
  logger.fatal({ err }, '💥 UNCAUGHT EXCEPTION! Shutting down process...');
  void gracefulShutdown('uncaughtException', 1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.fatal(
    { err: reason },
    '💥 UNHANDLED REJECTION! Shutting down process...',
  );
  void gracefulShutdown('unhandledRejection', 1);
});

// ---------------------------------------------------------
// Bootstrap & Start Application
// ---------------------------------------------------------

const startServer = async (): Promise<void> => {
  try {
    logger.info('Connecting to database...');
    await connectDB();

    // Express 5 passes listen errors (port in use, no permission) to this callback.
    server = app.listen(env.PORT, (error?: Error) => {
      if (error) {
        logger.fatal({ err: error }, `❌ Failed to listen on port ${env.PORT}`);
        process.exit(1);
      }

      logger.info(`Server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    logger.fatal({ err: error }, '❌ Failed to start server');
    process.exit(1);
  }
};

startServer();
