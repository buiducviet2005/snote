import { UserRole } from '@prisma/client';

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  timezone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface GoogleAuthDto {
  credential?: string;
  accessToken?: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  googleId?: string;
}

export interface UpdateProfileDto {
  fullName?: string;
  timezone?: string;
  avatarUrl?: string | null;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface TokenPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  timezone: string;
  role: UserRole;
  createdAt: Date;
}

export interface AuthResponseDto {
  user: UserResponseDto;
  accessToken: string;
}
