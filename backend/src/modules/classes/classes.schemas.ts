import { z } from 'zod';

const uuid = z.string().uuid();

export const createClassSchema = z.object({
  name: z.string().trim().min(2).max(150),
  code: z.string().trim().max(50).optional(),
  term: z.string().trim().max(100).optional(),
  description: z.string().trim().max(5000).optional()
});

export const updateClassSchema = createClassSchema.partial();
export const addClassMemberSchema = z.object({ email: z.string().trim().email() });
export const setClassMemberRoleSchema = z.object({ role: z.enum(['CLASS_ADMIN', 'STUDENT']) });
export const createGroupSchema = z.object({
  name: z.string().trim().min(2).max(150),
  leaderId: uuid
});
export const updateGroupSchema = z.object({ name: z.string().trim().min(2).max(150) });
export const addGroupMemberSchema = z.object({ userId: uuid });
export const setGroupLeaderSchema = z.object({ userId: uuid });
export const createClassProjectSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(5000).optional(),
  dueDate: z.string().datetime().optional()
});
export const updateClassProjectSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  status: z.enum(['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).optional()
});
export const submitProgressSchema = z.object({
  progressPercent: z.number().int().min(0).max(100),
  summary: z.string().trim().min(1).max(5000),
  blockers: z.string().trim().max(5000).optional()
});
export const reviewProgressSchema = z.object({
  reviewScore: z.number().int().min(0).max(100),
  reviewComment: z.string().trim().min(1).max(5000)
});

export const idParamSchema = z.object({ id: uuid });
export const memberParamSchema = z.object({ id: uuid, userId: uuid });
export const groupParamSchema = z.object({ id: uuid, groupId: uuid });
export const groupMemberParamSchema = z.object({ id: uuid, groupId: uuid, userId: uuid });
export const projectParamSchema = z.object({ id: uuid, projectId: uuid });
export const groupProjectParamSchema = z.object({ id: uuid, groupId: uuid });
export const reportParamSchema = z.object({ id: uuid, projectId: uuid, reportId: uuid });
