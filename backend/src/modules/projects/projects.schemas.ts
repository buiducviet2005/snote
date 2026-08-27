import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z
    .string({ required_error: 'Tên đồ án là bắt buộc' })
    .min(2, 'Tên đồ án phải có ít nhất 2 ký tự')
    .max(150, 'Tên đồ án không được vượt quá 150 ký tự'),
  description: z.string().optional(),
  semesterId: z.string().uuid('semesterId phải là UUID hợp lệ').optional(),
  subjectId: z.string().uuid('subjectId phải là UUID hợp lệ').optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).optional().default('ACTIVE')
});

export const updateProjectSchema = createProjectSchema.partial();
