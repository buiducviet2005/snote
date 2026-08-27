import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email là bắt buộc' })
    .email('Email không đúng định dạng')
    .max(255, 'Email không được vượt quá 255 ký tự'),
  password: z
    .string({ required_error: 'Mật khẩu là bắt buộc' })
    .min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự')
    .max(100, 'Mật khẩu không được vượt quá 100 ký tự'),
  fullName: z
    .string({ required_error: 'Họ và tên là bắt buộc' })
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ và tên không được vượt quá 100 ký tự'),
  timezone: z.string().optional().default('Asia/Ho_Chi_Minh')
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email là bắt buộc' })
    .email('Email không đúng định dạng'),
  password: z
    .string({ required_error: 'Mật khẩu là bắt buộc' })
    .min(1, 'Vui lòng nhập mật khẩu')
});
