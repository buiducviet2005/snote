import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string({ error: 'Email là bắt buộc' })
    .email('Email không đúng định dạng')
    .max(255, 'Email không được vượt quá 255 ký tự'),
  password: z
    .string({ error: 'Mật khẩu là bắt buộc' })
    .min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự')
    .max(100, 'Mật khẩu không được vượt quá 100 ký tự'),
  fullName: z
    .string({ error: 'Họ và tên là bắt buộc' })
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ và tên không được vượt quá 100 ký tự'),
  role: z.enum(['STUDENT', 'TEACHER']).optional().default('STUDENT'),
  timezone: z.string().optional().default('Asia/Ho_Chi_Minh')
});

export const loginSchema = z.object({
  email: z
    .string({ error: 'Email là bắt buộc' })
    .email('Email không đúng định dạng'),
  password: z
    .string({ error: 'Mật khẩu là bắt buộc' })
    .min(1, 'Vui lòng nhập mật khẩu')
});

export const googleAuthSchema = z
  .object({
    credential: z.string().optional(),
    accessToken: z.string().optional(),
    devEmail: z.string().email().optional()
  })
  .refine((data) => data.credential || data.accessToken, {
    message: 'Vui lòng cung cấp mã xác thực từ Google'
  });

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự').max(100).optional(),
  timezone: z.string().optional(),
  avatarUrl: z.string().url('URL ảnh đại diện không hợp lệ').nullable().optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải chứa ít nhất 6 ký tự').max(100)
});
