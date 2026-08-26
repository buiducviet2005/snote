import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { logger } from './shared/utils/logger';
import { errorHandler } from './shared/middleware/errorHandler';
import { notesRouter } from './modules/notes';

const app = express();

// Security & Utility Middlewares
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

// Correlation Request ID Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'ai-note-backend',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Register Domain Routers
app.use('/api/notes', notesRouter);

// Centralized Error Handling
app.use(errorHandler);

// Start Server
app.listen(env.PORT, () => {
  logger.info(`🚀 Server AI Note Backend đang chạy tại port ${env.PORT} [${env.NODE_ENV}]`);
});
