import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/appErrors';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const requestId = (req as any).id || req.headers['x-request-id'] || 'no-request-id';

  // 1. Xử lý lỗi Zod Validation (Request Body / Query Schema)
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));

    logger.warn(
      {
        path: req.path,
        method: req.method,
        requestId,
        validationErrors: formattedErrors
      },
      `Validation Error: [VALIDATION_ERROR] ${formattedErrors[0]?.message || 'Dữ liệu không hợp lệ'}`
    );

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: formattedErrors[0]?.message || 'Dữ liệu gửi lên không đúng định dạng',
        details: { errors: formattedErrors }
      }
    });
    return;
  }

  // 2. Lỗi nghiệp vụ dự kiến (Operational Errors)
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

  // 3. Lỗi lập trình hoặc lỗi hệ thống bất ngờ (Programmer / System Errors)
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
