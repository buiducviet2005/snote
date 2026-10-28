import { z } from 'zod';

const optionalUuid = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : val),
  z.string().uuid('ID không đúng định dạng UUID').optional()
);

export const createTaskSchema = z.object({
  title: z
    .string({ error: 'Tiêu đề công việc là bắt buộc' })
    .trim()
    .min(1, 'Tiêu đề công việc không được để trống')
    .max(255, 'Tiêu đề công việc không quá 255 ký tự'),
  description: z.string().optional(),
  subjectId: optionalUuid,
  projectId: optionalUuid,
  assigneeId: optionalUuid,
  assigneeIds: z.array(z.string().uuid('ID người tham gia không hợp lệ')).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional().default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
  dueDate: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  tagNames: z.array(z.string().trim().min(1)).optional()
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().optional(),
  subjectId: optionalUuid,
  projectId: optionalUuid,
  assigneeId: optionalUuid,
  assigneeIds: z.array(z.string().uuid('ID người tham gia không hợp lệ')).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.preprocess((val) => (val === '' ? null : val), z.string().nullable().optional()),
  tagNames: z.array(z.string().trim().min(1)).optional()
});
