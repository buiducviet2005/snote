import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().trim().max(255).optional().default(''),
  content: z.string(),
  subjectId: z.string().uuid('ID môn học không hợp lệ').nullable().optional(),
  projectId: z.string().uuid('ID đồ án không hợp lệ').nullable().optional(),
  workspaceId: z.string().uuid('ID không gian không hợp lệ').optional(),
  noteType: z.enum(['LECTURE', 'LAB_REPORT', 'EXAM_PREP', 'PROJECT_LOG', 'MEETING_MINUTES', 'GENERAL'], {
    error: 'Loại ghi chú không hợp lệ'
  }).default('GENERAL'),
  tagNames: z.array(z.string().trim().min(1)).optional()
});

export const updateNoteSchema = z.object({
  title: z.string().trim().max(255).optional(),
  content: z.string().optional(),
  subjectId: z.string().uuid('ID môn học không hợp lệ').nullable().optional(),
  projectId: z.string().uuid('ID đồ án không hợp lệ').nullable().optional(),
  noteType: z.enum(['LECTURE', 'LAB_REPORT', 'EXAM_PREP', 'PROJECT_LOG', 'MEETING_MINUTES', 'GENERAL']).optional(),
  tagNames: z.array(z.string().trim().min(1)).optional()
});
