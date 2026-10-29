import { z } from 'zod';

export const createSemesterSchema = z.object({
  name: z
    .string({ error: 'Tên học kỳ là bắt buộc' })
    .min(2, 'Tên học kỳ phải có ít nhất 2 ký tự')
    .max(100, 'Tên học kỳ không được vượt quá 100 ký tự'),
  academicYear: z
    .string({ error: 'Năm học là bắt buộc' })
    .min(4, 'Năm học phải có ít nhất 4 ký tự')
    .max(50, 'Năm học không được vượt quá 50 ký tự'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional().default(false),
  status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional().default('ACTIVE')
});

export const updateSemesterSchema = createSemesterSchema.partial();
