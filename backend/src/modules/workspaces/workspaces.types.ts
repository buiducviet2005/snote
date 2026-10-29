import type {
  ProjectStatus,
  WorkspaceMembershipStatus,
  WorkspaceRole,
  WorkspaceStatus,
  WorkspaceType
} from '@prisma/client';

export interface ProjectWorkspaceInput {
  semesterId?: string | null;
  subjectId?: string | null;
  description?: string | null;
  status?: ProjectStatus;
  startDate?: string | null;
  dueDate?: string | null;
}

export interface CreateWorkspaceInput {
  type: Exclude<WorkspaceType, 'GROUP'>;
  name: string;
  timezone?: string;
  subject?: { subjectId: string };
  project?: ProjectWorkspaceInput;
}

export interface WorkspaceListInput {
  type?: WorkspaceType;
  status?: WorkspaceStatus;
  cursor?: string;
  limit: number;
}

export interface WorkspaceSubjectDto {
  id: string;
  semesterId: string;
  code: string | null;
}

export interface WorkspaceProjectDto {
  id: string;
  semesterId: string | null;
  subjectId: string | null;
  description: string | null;
  status: ProjectStatus;
  startDate: Date | null;
  dueDate: Date | null;
}

export interface WorkspaceDto {
  id: string;
  type: WorkspaceType;
  name: string;
  ownerId: string;
  status: WorkspaceStatus;
  timezone: string;
  project: WorkspaceProjectDto | null;
  subject: WorkspaceSubjectDto | null;
  group: { id: string; classId: string; leaderId: string; courseClass: { name: string } } | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMemberDto {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  status: WorkspaceMembershipStatus;
  version: number;
  joinedAt: Date | null;
  user: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export interface WorkspaceContextDto {
  workspace: WorkspaceDto;
  membership: WorkspaceMemberDto;
  effectivePermissions: string[];
  capabilities: ReturnType<typeof import('./workspaces.policy').workspaceCapabilities>;
  policy: {
    reviewRequired: boolean;
    selfReviewAllowed: boolean;
    editOthersNotes: boolean;
    editOthersDocuments: boolean;
  };
  limits: typeof import('./workspaces.policy').workspaceLimits;
}

export interface PageMeta {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CursorPayload {
  createdAt: string;
  id: string;
}
