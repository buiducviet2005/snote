export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Dữ liệu đầu vào không hợp lệ', details?: any) {
    super(400, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Yêu cầu xác thực tài khoản') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Bạn không có quyền thực hiện hành động này') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Không tìm thấy tài nguyên yêu cầu') {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Dữ liệu xung đột hoặc đã tồn tại') {
    super(409, message);
  }
}
