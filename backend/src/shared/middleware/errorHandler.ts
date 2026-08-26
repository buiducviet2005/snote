import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/appErrors';
import { logger } from '../utils/logger';
import { env } from '../../config/env';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Ghi log lỗi nội bộ
  logger.error({
    err,
    requestId: req.headers['x-request-id'],
    method: req.method,
    url: req.originalUrl
  });

  // Nếu là Custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        details: err.details
      }
    });
    return;
  }

  // Nếu là lỗi vi phạm Constraint của Prisma / Postgres
  if (err.code === 'P2002') {
    res.status(409).json({
      error: {
        message: 'Dữ liệu đã tồn tại (Unique Constraint Violation)',
        target: err.meta?.target
      }
    });
    return;
  }

  // Lỗi không xác định (Internal Server Error)
  const isDev = env.NODE_ENV === 'development';
  res.status(500).json({
    error: {
      message: 'Internal Server Error',
      ...(isDev && { stack: err.stack, raw: err.message })
    }
  });
}
