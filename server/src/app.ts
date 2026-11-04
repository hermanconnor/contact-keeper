import express, { type Application } from 'express';
import requestLogger from './middleware/requestLogger.js';
import healthRoutes from '@/routes/health.routes.js';
import authRoutes from '@/routes/auth.routes.js';
import userRoutes from '@/routes/user.routes.js';
import contactRoutes from '@/routes/contact.routes.js';

const app: Application = express();

// HTTP request logger
app.use(requestLogger);

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'Welcome to the ContactKeeper API...' });
});

// HEALTH CHECK
app.use('/api/health', healthRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contacts', contactRoutes);

export default app;
