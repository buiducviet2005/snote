import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề ghi chú không được để trống').max(255),
  content: z.string().min(1, 'Nội dung ghi chú không được để trống'),
  subjectId: z.string().uuid('ID môn học không hợp lệ').optional(),
  projectId: z.string().uuid('ID đồ án không hợp lệ').optional(),
  noteType: z.enum(['LECTURE', 'ASSIGNMENT', 'EXAM_REVIEW', 'RESOURCE', 'IDEA'], {
    errorMap: () => ({ message: 'Loại ghi chú không hợp lệ' })
  }),
  tagNames: z.array(z.string().trim().min(1)).optional()
}).refine(
  (data) => Boolean(data.subjectId || data.projectId),
  {
    message: 'Ghi chú bắt buộc phải gắn với ít nhất một Môn học (subjectId) hoặc Đồ án (projectId)',
    path: ['subjectId']
  }
);
