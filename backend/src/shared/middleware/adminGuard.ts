import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, AuthError } from '../errors/appErrors';
import { UserRole } from '@prisma/client';

/**
 * Middleware RBAC: Giới hạn chỉ tài khoản có vai trò ADMIN mới được phép truy cập.
 * Phải được đặt sau `authGuard`.
 */
export function adminGuard(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user || !req.user.id) {
    throw new AuthError('Yêu cầu xác thực tài khoản trước khi kiểm tra quyền hạn');
  }

  if (req.user.role !== UserRole.ADMIN) {
    throw new ForbiddenError('Truy cập bị từ chối: Chỉ tài khoản Quản Trị Viên (Admin) mới có quyền truy cập tài nguyên này', {
      currentRole: req.user.role || 'STUDENT',
      requiredRole: UserRole.ADMIN
    });
  }

  next();
}
