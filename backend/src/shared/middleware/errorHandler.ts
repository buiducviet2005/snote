import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/appErrors';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const requestId = (req as any).id || req.headers['x-request-id'] || 'no-request-id';

  // 1. Lỗi nghiệp vụ dự kiến (Operational Errors)
  if (err instanceof AppError && err.isOperational) {
    logger.warn(
      {
        err,
        path: req.path,
        method: req.method,
        requestId,
        context: err.context
      },
      `Operational Error: [${err.code}] ${err.message}`
    );

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: Object.keys(err.context).length > 0 ? err.context : undefined
      }
    });
    return;
  }

  // 2. Lỗi lập trình hoặc lỗi hệ thống bất ngờ (Programmer / System Errors)
  logger.error(
    {
      err,
      path: req.path,
      method: req.method,
      requestId
    },
    'Unhandled Unexpected Error in Express Pipeline'
  );

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  });
}
