import type { Request, Response } from 'express';
import { testConnection } from '@/config/db.js';

const snapshot = () => ({
  uptime: Math.floor(process.uptime()),
  timestamp: new Date().toISOString(),
});

/**
 * Liveness: "the process is up and serving requests". Deliberately never touches the
 * database, so a database blip can't make a platform health check restart a healthy
 * server.
 */
export const getHealth = (_req: Request, res: Response): void => {
  res.set('Cache-Control', 'no-store');

  res.status(200).json({
    success: true,
    data: { status: 'healthy', ...snapshot() },
  });
};

/** Readiness: "the server can do useful work", i.e. the database answers a ping. */
export const getReadiness = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const dbHealthy = await testConnection();

  res.set('Cache-Control', 'no-store');

  res.status(dbHealthy ? 200 : 503).json({
    success: dbHealthy,
    data: {
      status: dbHealthy ? 'ready' : 'not_ready',
      database: dbHealthy ? 'connected' : 'disconnected',
      ...snapshot(),
    },
  });
};
