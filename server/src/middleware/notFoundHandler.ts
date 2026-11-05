import type { RequestHandler } from 'express';
import { AppError } from '@/utils/AppError.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(
    new AppError(
      `Cannot find ${req.method} ${req.originalUrl} on this server`,
      404,
    ),
  );
};
