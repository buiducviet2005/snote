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

export interface UserResponseDto {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  timezone: string;
  createdAt: Date | string;
}

export interface AuthResponseDto {
  user: UserResponseDto;
  accessToken: string;
}
