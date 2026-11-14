import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from '@/config/env.js';
import requestLogger from './middleware/requestLogger.js';
import healthRoutes from '@/modules/health/health.routes.js';
import authRoutes from '@/modules/auth/auth.routes.js';
import userRoutes from '@/modules/users/user.routes.js';
import contactRoutes from '@/modules/contacts/contact.routes.js';
import { errorHandler } from '@/middleware/errorHandler.js';
import { notFoundHandler } from '@/middleware/notFoundHandler.js';

const app: Application = express();

// HTTP request logger
app.use(requestLogger);

// SECURITY HEADERS
app.use(helmet());

// CORS: explicit allowlist (never "*" with credentials). `credentials: true` is what lets
// the browser send the refresh cookie on cross-site requests from the frontend.
app.use(
  cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    // Lets frontend code read the rate-limit headers on a 429.
    exposedHeaders: ['Retry-After', 'RateLimit', 'RateLimit-Policy'],
    maxAge: 600, // cache preflight answers for 10 minutes
  }),
);

// MIDDLEWARE
app.use(express.json());

app.use(cookieParser());

// ROUTES
app.use('/api/v1/health', healthRoutes);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/contacts', contactRoutes);

// NOT FOUND HANDLER
app.use(notFoundHandler);

// GLOBAL ERROR HANDLER
app.use(errorHandler);

export default app;
