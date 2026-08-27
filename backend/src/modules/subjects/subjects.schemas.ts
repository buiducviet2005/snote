import { z } from 'zod';

export const createSubjectSchema = z.object({
  semesterId: z.string({ required_error: 'Học kỳ (semesterId) là bắt buộc' }).uuid('semesterId phải là UUID hợp lệ'),
  name: z
    .string({ required_error: 'Tên môn học là bắt buộc' })
    .min(2, 'Tên môn học phải có ít nhất 2 ký tự')
    .max(150, 'Tên môn học không được vượt quá 150 ký tự'),
  code: z.string().max(50, 'Mã môn học không vượt quá 50 ký tự').optional(),
  credits: z.number().int().min(0, 'Số tín chỉ không được âm').max(20, 'Số tín chỉ không quá 20').optional().default(3),
  lecturer: z.string().max(100, 'Tên giảng viên không quá 100 ký tự').optional(),
  color: z.string().max(20).optional().default('#3b82f6'),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional().default('ACTIVE')
});

export const updateSubjectSchema = createSubjectSchema.partial();
