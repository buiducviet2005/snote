import { ProjectStatus, ProjectMemberRole } from '@prisma/client';

export interface CreateProjectDto {
  name: string;
  description?: string;
  semesterId?: string;
  subjectId?: string;
  startDate?: string;
  dueDate?: string;
  status?: ProjectStatus;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  semesterId?: string;
  subjectId?: string;
  startDate?: string;
  dueDate?: string;
  status?: ProjectStatus;
}

export interface ProjectMemberDto {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  joinedAt: Date;
  user?: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string | null;
  };
}

export interface AddProjectMemberDto {
  emailOrUserId: string;
  role?: ProjectMemberRole;
}

export interface UpdateProjectMemberRoleDto {
  role: ProjectMemberRole;
}

export interface ProjectResponseDto {
  id: string;
  name: string;
  description: string | null;
  semesterId: string | null;
  subjectId: string | null;
  status: ProjectStatus;
  startDate: Date | null;
  dueDate: Date | null;
  notesCount?: number;
  tasksCount?: number;
  membersCount?: number;
  members?: ProjectMemberDto[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectWorkspaceDto extends ProjectResponseDto {
  subject?: {
    id: string;
    name: string;
    code: string | null;
    color: string | null;
  } | null;
  semester?: {
    id: string;
    name: string;
    academicYear: string;
  } | null;
  notes: any[];
  tasks: any[];
}
