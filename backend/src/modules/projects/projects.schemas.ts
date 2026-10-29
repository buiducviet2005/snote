import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z
    .string({ error: 'Tên dự án / bài tập lớn là bắt buộc' })
    .min(2, 'Tên dự án / bài tập lớn phải có ít nhất 2 ký tự')
    .max(150, 'Tên dự án / bài tập lớn không được vượt quá 150 ký tự'),
  description: z.string().optional(),
  semesterId: z.string().uuid('semesterId phải là UUID hợp lệ').optional(),
  subjectId: z.string().uuid('subjectId phải là UUID hợp lệ').optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).optional().default('ACTIVE')
});

export const updateProjectSchema = createProjectSchema.partial();

export const addProjectMemberSchema = z.object({
  emailOrUserId: z.string().trim().min(1),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER')
}).strict();

export const updateProjectMemberRoleSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])
}).strict();
