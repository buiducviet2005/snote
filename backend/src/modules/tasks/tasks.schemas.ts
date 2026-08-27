import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Tiêu đề công việc là bắt buộc' })
    .trim()
    .min(1, 'Tiêu đề công việc không được để trống')
    .max(255, 'Tiêu đề công việc không quá 255 ký tự'),
  description: z.string().optional(),
  subjectId: z.string().uuid('ID môn học không hợp lệ').nullable().optional(),
  projectId: z.string().uuid('ID đồ án không hợp lệ').nullable().optional(),
  assigneeId: z.string().uuid('ID người phụ trách không hợp lệ').nullable().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional().default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
  dueDate: z.string().optional(),
  tagNames: z.array(z.string().trim().min(1)).optional()
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().optional(),
  subjectId: z.string().uuid('ID môn học không hợp lệ').nullable().optional(),
  projectId: z.string().uuid('ID đồ án không hợp lệ').nullable().optional(),
  assigneeId: z.string().uuid('ID người phụ trách không hợp lệ').nullable().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().nullable().optional(),
  tagNames: z.array(z.string().trim().min(1)).optional()
});
