import { prisma } from '../../shared/db/prismaClient';
import { User, RefreshToken, UserRole } from '@prisma/client';
import { AuthError, NotFoundError } from '../../shared/errors/appErrors';

export class AuthRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        deletedAt: null
      }
    });
  }

  async findUserByGoogleId(googleId: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        googleId,
        deletedAt: null
      }
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        id,
        deletedAt: null
      }
    });
  }

  async createUser(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    role?: UserRole;
    timezone?: string;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        role: data.role || 'STUDENT',
        timezone: data.timezone || 'Asia/Ho_Chi_Minh'
      }
    });
  }

  async createGoogleUser(data: {
    email: string;
    fullName: string;
    avatarUrl?: string | null;
    googleId: string;
    timezone?: string;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
        googleId: data.googleId,
        timezone: data.timezone || 'Asia/Ho_Chi_Minh'
      }
    });
  }

  async linkGoogleAccount(userId: string, data: {
    googleId: string;
    avatarUrl?: string | null;
  }): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        googleId: data.googleId,
        ...(data.avatarUrl ? { avatarUrl: data.avatarUrl } : {})
      }
    });
  }

  async updateUser(id: string, data: {
    fullName?: string;
    timezone?: string;
    avatarUrl?: string | null;
  }): Promise<User> {
    return prisma.user.update({
      where: { id },
      data
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { passwordHash }
    });
  }

  async saveRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data
    });
  }

  async findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date()
        }
      }
    });
  }

  async revokeRefreshToken(id: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() }
    });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  /**
   * P0 Session Hardening: Luân chuyển Refresh Token nguyên tử trong Transaction (Atomic Token Rotation).
   * Phát hiện Token Reuse Attack: Nếu token cũ đã bị thu hồi trước đó, ngay lập tức thu hồi toàn bộ token của User.
   * Kiểm tra trạng thái User: Ngăn chặn tài khoản SUSPENDED tiếp tục duy trì phiên làm việc.
   */
  async rotateRefreshTokenAtomic(
    oldTokenHash: string,
    newRefreshTokenData: { userId: string; tokenHash: string; expiresAt: Date }
  ): Promise<{ user: User; newRefreshToken: RefreshToken }> {
    return prisma.$transaction(async (tx) => {
      // 1. Tìm token còn hiệu lực
      const existingToken = await tx.refreshToken.findFirst({
        where: {
          tokenHash: oldTokenHash,
          revokedAt: null,
          expiresAt: { gt: new Date() }
        }
      });

      if (!existingToken) {
        // Kiểm tra xem token này có phải đã bị revoked trước đó không (Dấu hiệu Token Reuse Attack)
        const revokedToken = await tx.refreshToken.findFirst({
          where: { tokenHash: oldTokenHash }
        });

        if (revokedToken) {
          // Token reuse detected! Thu hồi toàn bộ refresh token của người dùng này để vô hiệu hóa kẻ tấn công
          await tx.refreshToken.updateMany({
            where: { userId: revokedToken.userId, revokedAt: null },
            data: { revokedAt: new Date() }
          });
        }

        throw new AuthError('Refresh token không hợp lệ hoặc đã bị thu hồi');
      }

      // 2. Thu hồi token cũ (Một lần duy nhất)
      await tx.refreshToken.update({
        where: { id: existingToken.id },
        data: { revokedAt: new Date() }
      });

      // 3. Kiểm tra user tương ứng
      const user = await tx.user.findFirst({
        where: { id: existingToken.userId, deletedAt: null }
      });

      if (!user) {
        throw new NotFoundError('Không tìm thấy tài khoản người dùng tương ứng với phiên');
      }

      if (user.status === 'SUSPENDED') {
        throw new AuthError('Tài khoản của bạn đã bị tạm khóa, vui lòng liên hệ quản trị viên');
      }

      // 4. Tạo token mới
      const newRefreshToken = await tx.refreshToken.create({
        data: newRefreshTokenData
      });

      return { user, newRefreshToken };
    });
  }
}
