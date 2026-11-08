import type { Request, Response } from 'express';
import { testConnection } from '@/config/db.js';

export const getHealth = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const dbHealthy = await testConnection();

  const healthCheck = {
    uptime: process.uptime(),
    timeStamp: new Date().toISOString(),
    status: dbHealthy ? 'healthy' : 'unhealthy',
    database: dbHealthy ? 'connected' : 'disconnected',
  };

  res.status(dbHealthy ? 200 : 503).json({
    success: dbHealthy,
    data: healthCheck,
  });
};
