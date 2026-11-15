import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { env } from '@/config/env.js';
import requestLogger from '@/middleware/requestLogger.js';
import { errorHandler } from '@/middleware/errorHandler.js';
import { verifyOrigin } from '@/middleware/verifyOrigin.js';
import { notFoundHandler } from '@/middleware/notFoundHandler.js';
import healthRoutes from '@/modules/health/health.routes.js';
import authRoutes from '@/modules/auth/auth.routes.js';
import userRoutes from '@/modules/users/user.routes.js';
import contactRoutes from '@/modules/contacts/contact.routes.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { createDocsRouter } from '@/docs/docs.routes.js';

const app: Application = express();

// Behind a reverse proxy (Render), req.ip is the proxy unless Express is told how many
// hops to trust. Rate limiting and request logs both depend on it.
app.set('trust proxy', env.TRUST_PROXY);

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

app.use(compression());

// API DOCS (Swagger UI): on by default outside production, opt in with API_DOCS_ENABLED=true.
// Mounted outside /api so the large, cacheable Swagger UI assets skip no-store and the API limiter.
if (env.API_DOCS_ENABLED ?? env.NODE_ENV !== 'production') {
  app.use('/docs', createDocsRouter());
}

// Everything under /api is private, per-user data: never let a browser or shared cache keep it.
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// HEALTH: mounted before the rate limiter so platform probes are never throttled.
app.use('/api/v1/health', healthRoutes);

// RATE LIMITING: before body parsing, so floods are rejected without paying to parse them.
app.use('/api', apiLimiter);

// BODY PARSING: payloads here are tiny, so a small cap costs nothing and blocks oversized bodies.
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// CSRF: refuse state-changing requests from browser origins that aren't allowlisted.
app.use('/api', verifyOrigin);

// ROUTES
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/contacts', contactRoutes);

// NOT FOUND HANDLER
app.use(notFoundHandler);

// GLOBAL ERROR HANDLER
app.use(errorHandler);

export default app;
