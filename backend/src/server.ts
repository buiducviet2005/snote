// SNOTE Backend Server - Loaded with PostgreSQL 18 Local Database
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './shared/utils/logger';
import { errorHandler } from './shared/middleware/errorHandler';
import { apiRateLimiter } from './shared/middleware/rateLimit';

// Import Domain Modules
import { healthRouter } from './modules/health';
import { authRouter } from './modules/auth';
import { semestersRouter } from './modules/semesters';
import { subjectsRouter } from './modules/subjects';
import { projectsRouter } from './modules/projects';
import { notesRouter } from './modules/notes';
import { tasksRouter } from './modules/tasks';
import { scheduleRouter } from './modules/schedule';
import { backupRouter } from './modules/backup';
import { searchRouter } from './modules/search';
import { sharesRouter } from './modules/shares';
import { classesRouter } from './modules/classes';
import { workspacesRouter } from './modules/workspaces';

// 1. Khởi tạo Express Application
const app = express();

// 2. Bảo mật HTTP Headers & Ẩn Fingerprint
app.disable('x-powered-by');
app.use(helmet());

// 3. Xử lý CORS & Cookie credentials
app.use(
  cors({
    origin: [env.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id']
  })
);

// 4. Body Parsers & Cookie Parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

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

// 7. Health Check Probes (/health, /health/live, /health/ready) & Root Redirection
app.use('/health', healthRouter);
app.get('/', (_req, res) => {
  res.redirect('http://localhost:5173');
});

// 8. Đăng ký Domain Routes (Modular Monolith)
app.use('/api/auth', authRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/v1/workspaces', workspacesRouter);
app.use('/api/semesters', semestersRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/backup', backupRouter);
app.use('/api/search', searchRouter);
app.use('/api/shares', sharesRouter);
app.use('/api/classes', classesRouter);

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
