export class AppError extends Error {
  public readonly isOperational: boolean;
  public readonly statusCode: number;
  public readonly code: string;
  public readonly context: Record<string, unknown>;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    context: Record<string, unknown> = {},
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.context = context;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, 400, 'VALIDATION_ERROR', context, true);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, 400, 'BAD_REQUEST', context, true);
  }
}

export class AuthError extends AppError {
  constructor(message = 'Unauthorized: Truy cập yêu cầu xác thực', context: Record<string, unknown> = {}) {
    super(message, 401, 'UNAUTHORIZED', context, true);
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message = 'Unauthorized: Truy cập yêu cầu xác thực', context: Record<string, unknown> = {}) {
    super(message, context);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden: Bạn không có quyền truy cập tài nguyên này', context: Record<string, unknown> = {}) {
    super(message, 403, 'FORBIDDEN', context, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found: Không tìm thấy tài nguyên yêu cầu', context: Record<string, unknown> = {}) {
    super(message, 404, 'NOT_FOUND', context, true);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict: Dữ liệu đã tồn tại hoặc bị xung đột', context: Record<string, unknown> = {}) {
    super(message, 409, 'CONFLICT', context, true);
  }
}
