import { ProjectStatus, ProjectMemberRole } from '../enums';

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
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  joinedAt: Date | string;
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

export interface ProjectResponseDto {
  id: string;
  name: string;
  description: string | null;
  semesterId: string | null;
  subjectId: string | null;
  status: ProjectStatus;
  startDate: Date | string | null;
  dueDate: Date | string | null;
  notesCount?: number;
  tasksCount?: number;
  membersCount?: number;
  members?: ProjectMemberDto[];
  createdAt: Date | string;
  updatedAt: Date | string;
}
