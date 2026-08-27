import { Router } from 'express';
import { prisma } from '../../shared/db/prismaClient';
import { env } from '../../config/env';
import { asyncBoundary } from '../../shared/middleware/asyncBoundary';

const router = Router();

/**
 * Root Health Endpoint
 */
router.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'snote-backend',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

/**
 * Liveness Probe: Kiểm tra HTTP Service còn sống.
 * Dùng cho Kubernetes, Docker healthcheck hoặc Uptime Monitor.
 */
router.get('/live', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'snote-backend',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

/**
 * Readiness Probe: Kiểm tra cơ sở dữ liệu PostgreSQL đã sẵn sàng nhận truy vấn.
 */
router.get(
  '/ready',
  asyncBoundary(async (_req, res) => {
    // Thực thi câu lệnh kiểm tra kết nối DB nhanh qua Prisma Client
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'ok',
      database: 'connected',
      service: 'snote-backend',
      timestamp: new Date().toISOString()
    });
  })
);

export const healthRouter = router;
