import { z } from 'zod';

export const createScheduleEventSchema = z.object({
  semesterId: z.string().uuid('ID học kỳ không hợp lệ').optional(),
  subjectId: z.string().uuid('ID môn học không hợp lệ').optional(),
  title: z
    .string({ required_error: 'Tiêu đề sự kiện là bắt buộc' })
    .min(1, 'Tiêu đề sự kiện không được để trống')
    .max(150, 'Tiêu đề sự kiện không quá 150 ký tự'),
  location: z.string().max(150, 'Địa điểm không quá 150 ký tự').optional(),
  eventType: z.enum(['CLASS', 'EXAM', 'DEADLINE', 'GROUP_MEETING', 'PERSONAL']).optional().default('CLASS'),
  startTime: z.string({ required_error: 'Thời gian bắt đầu là bắt buộc' }),
  endTime: z.string({ required_error: 'Thời gian kết thúc là bắt buộc' }),
  isRecurring: z.boolean().optional().default(false),
  recurrenceRule: z.string().max(100).optional()
});

export const updateScheduleEventSchema = createScheduleEventSchema.partial();
