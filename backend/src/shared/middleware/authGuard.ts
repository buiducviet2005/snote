import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AuthError } from '../errors/appErrors';

export interface JwtPayload {
  sub: string;
  email?: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware bắt buộc xác thực JWT Token.
 * Gắn `req.user = { id: sub }` phục vụ chống IDOR.
 */
export function authGuard(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Truy cập yêu cầu Header Authorization với Bearer Token', {
      headerProvided: !!authHeader
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    
    if (!decoded.sub) {
      throw new AuthError('Token không hợp lệ (thiếu subject identifier)', { decoded });
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email
    };

    next();
  } catch (err: any) {
    if (err instanceof AuthError) {
      throw err;
    }
    throw new AuthError(
      err.name === 'TokenExpiredError'
        ? 'Token xác thực đã hết hạn'
        : 'Token xác thực không hợp lệ',
      { originalError: err.message }
    );
  }
}

/**
 * Middleware tùy chọn xác thực (nếu có token thì gán req.user, không có thì bỏ qua).
 */
export function optionalAuthGuard(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    if (decoded.sub) {
      req.user = {
        id: decoded.sub,
        email: decoded.email
      };
    }
  } catch {
    // Bỏ qua lỗi token ở optionalAuthGuard
  }

  next();
}
