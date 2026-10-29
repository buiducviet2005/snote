import { z } from 'zod';
import { isValidTimeZone } from './workspaces.policy';

function isValidDateOnly(value: string): boolean {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có dạng YYYY-MM-DD')
  .refine(isValidDateOnly, 'Ngày không hợp lệ');

const projectInput = z
  .object({
    semesterId: z.string().uuid().nullable().optional(),
    subjectId: z.string().uuid().nullable().optional(),
    description: z.string().max(10_000).nullable().optional(),
    status: z.enum(['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).optional(),
    startDate: dateOnly.nullable().optional(),
    dueDate: dateOnly.nullable().optional()
  })
  .strict();

export const createWorkspaceSchema = z
  .object({
    type: z.enum(['PERSONAL', 'SUBJECT', 'PROJECT']),
    name: z.string().trim().min(1).max(150),
    timezone: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .refine(isValidTimeZone, 'Timezone IANA không hợp lệ')
      .optional(),
    subject: z.object({ subjectId: z.string().uuid() }).strict().optional(),
    project: projectInput.optional()
  })
  .strict()
  .superRefine((value, context) => {
    if (value.type === 'PERSONAL' && (value.subject || value.project)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['type'],
        message: 'PERSONAL không nhận liên kết subject hoặc project'
      });
    }
    if (value.type === 'SUBJECT' && (!value.subject || value.project)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['subject'],
        message: 'SUBJECT yêu cầu subjectId và không nhận project'
      });
    }
    if (value.type === 'PROJECT' && (!value.project || value.subject)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['project'],
        message: 'PROJECT yêu cầu metadata project và không nhận subject'
      });
    }
  });

export const listWorkspacesSchema = z
  .object({
    type: z.enum(['PERSONAL', 'SUBJECT', 'PROJECT', 'GROUP']).optional(),
    status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
    cursor: z.string().max(1000).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50)
  })
  .strict();

export const listMembersSchema = z
  .object({
    cursor: z.string().max(1000).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50)
  })
  .strict();

export const addWorkspaceMemberSchema = z
  .object({
    email: z.string().trim().email('Email không hợp lệ'),
    role: z.enum(['MANAGER', 'MEMBER', 'VIEWER']).default('MEMBER')
  })
  .strict();

export const joinWorkspaceSchema = z
  .object({
    codeOrId: z.string().trim().min(1, 'Mã hoặc ID không gian là bắt buộc')
  })
  .strict();

export type CreateWorkspaceSchemaInput = z.infer<typeof createWorkspaceSchema>;
export type AddWorkspaceMemberInput = z.infer<typeof addWorkspaceMemberSchema>;
export type JoinWorkspaceInput = z.infer<typeof joinWorkspaceSchema>;
