import { UserRole } from '../enums';

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

export interface UpdateProfileDto {
  fullName?: string;
  timezone?: string;
  avatarUrl?: string | null;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  timezone: string;
  role: UserRole;
  createdAt: Date | string;
}

export interface AuthResponseDto {
  user: UserResponseDto;
  accessToken: string;
}
