import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './shared/utils/logger';
import { errorHandler } from './shared/middleware/errorHandler';
import { apiRateLimiter } from './shared/middleware/rateLimit';
import { notesRouter } from './modules/notes';

// 1. Khởi tạo Express Application
const app = express();

// 2. Bảo mật HTTP Headers & Ẩn Fingerprint
app.disable('x-powered-by');
app.use(helmet());

// 3. Xử lý CORS & Preflight
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id']
  })
);

// 4. Body Parsers với Payload Size Limit (Chống DoS)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 5. Structured Request Logging (Pino HTTP)
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    customLogLevel: (_req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    }
  })
);

// 6. Global API Rate Limiting
app.use('/api/', apiRateLimiter);

// 7. Health Check Endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'snote-backend',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// 8. Đăng ký Domain Routes
app.use('/api/notes', notesRouter);

// 9. Centralized Error Handling Middleware (Bắt buộc đặt cuối cùng)
app.use(errorHandler);

// 10. Khởi động HTTP Server
const server = app.listen(env.PORT, () => {
  logger.info(`🚀 SNOTE Backend Server đang chạy tại port ${env.PORT} [${env.NODE_ENV}]`);
});

// 11. Xử lý Unhandled Rejections & Uncaught Exceptions (Process Level)
process.on('unhandledRejection', (reason: any) => {
  logger.error({ err: reason }, 'Unhandled Promise Rejection phát hiện tại Process level');
});

process.on('uncaughtException', (err: Error) => {
  logger.fatal({ err }, 'Uncaught Exception nghiêm trọng! Tiến hành Shutdown server an toàn...');
  server.close(() => {
    process.exit(1);
  });
});

export { app, server };
