import express, { type Application } from 'express';
import requestLogger from './middleware/requestLogger.js';
import healthRoutes from '@/routes/health.routes.js';
import authRoutes from '@/routes/auth.routes.js';
import userRoutes from '@/routes/user.routes.js';
import contactRoutes from '@/routes/contact.routes.js';
import { errorHandler } from '@/middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';

const app: Application = express();

// HTTP request logger
app.use(requestLogger);

// MIDDLEWARE
app.use(express.json());

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
