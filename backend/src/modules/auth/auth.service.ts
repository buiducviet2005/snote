import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AuthRepository } from './auth.repository';
import { RegisterDto, LoginDto, AuthResponseDto, AuthTokens, TokenPayload, UserResponseDto } from './auth.types';
import { env } from '../../config/env';
import { ConflictError, AuthError, NotFoundError } from '../../shared/errors/appErrors';

export class AuthService {
  constructor(private readonly authRepo: AuthRepository = new AuthRepository()) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '15m'
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: '7d'
    });

    return { accessToken, refreshToken };
  }

  private mapUserResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      timezone: user.timezone,
      createdAt: user.createdAt
    };
  }

  async register(dto: RegisterDto): Promise<{ authResponse: AuthResponseDto; refreshToken: string }> {
    const existing = await this.authRepo.findUserByEmail(dto.email);
    if (existing) {
      throw new ConflictError('Email này đã được sử dụng trên hệ thống');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.authRepo.createUser({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      timezone: dto.timezone
    });

    const { accessToken, refreshToken } = this.generateTokens({
      sub: user.id,
      email: user.email
    });

    // Lưu tokenHash vào CSDL với thời hạn 7 ngày
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.authRepo.saveRefreshToken({
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt
    });

    return {
      authResponse: {
        user: this.mapUserResponse(user),
        accessToken
      },
      refreshToken
    };
  }

  async login(dto: LoginDto): Promise<{ authResponse: AuthResponseDto; refreshToken: string }> {
    const user = await this.authRepo.findUserByEmail(dto.email);
    if (!user) {
      throw new AuthError('Email hoặc mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new AuthError('Email hoặc mật khẩu không chính xác');
    }

    const { accessToken, refreshToken } = this.generateTokens({
      sub: user.id,
      email: user.email
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.authRepo.saveRefreshToken({
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt
    });

    return {
      authResponse: {
        user: this.mapUserResponse(user),
        accessToken
      },
      refreshToken
    };
  }

  async refresh(rawRefreshToken: string): Promise<{ accessToken: string; newRefreshToken: string }> {
    let payload: TokenPayload;
    try {
      payload = jwt.verify(rawRefreshToken, env.JWT_REFRESH_SECRET) as TokenPayload;
    } catch {
      throw new AuthError('Refresh Token không hợp lệ hoặc đã hết hạn');
    }

    const tokenHash = this.hashToken(rawRefreshToken);
    const storedToken = await this.authRepo.findRefreshToken(tokenHash);

    if (!storedToken || storedToken.userId !== payload.sub) {
      throw new AuthError('Refresh Token đã bị thu hồi hoặc không tồn tại');
    }

    // Token Rotation: Thu hồi token cũ và phát hành token mới
    await this.authRepo.revokeRefreshToken(storedToken.id);

    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens({
      sub: payload.sub,
      email: payload.email
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.authRepo.saveRefreshToken({
      userId: payload.sub,
      tokenHash: this.hashToken(newRefreshToken),
      expiresAt
    });

    return { accessToken, newRefreshToken };
  }

  async logout(rawRefreshToken?: string): Promise<void> {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      const storedToken = await this.authRepo.findRefreshToken(tokenHash);
      if (storedToken) {
        await this.authRepo.revokeRefreshToken(storedToken.id);
      }
    }
  }

  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.authRepo.findUserById(userId);
    if (!user) {
      throw new NotFoundError('Không tìm thấy tài khoản người dùng');
    }
    return this.mapUserResponse(user);
  }
}
