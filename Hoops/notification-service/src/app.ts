import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import notificationsRouter from './routes/notifications';
import devicesRouter from './routes/devices';
import preferencesRouter from './routes/preferences';
import testRouter from './routes/test';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'hoops-notification' });
});

// Routes
app.use('/notifications', notificationsRouter);
app.use('/devices', devicesRouter);
app.use('/preferences', preferencesRouter);
app.use('/test', testRouter);

// Error handler - must be last
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export { app };