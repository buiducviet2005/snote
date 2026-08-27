import { TaskStatus, TaskPriority } from '@prisma/client';

export interface CreateTaskDto {
  title: string;
  description?: string;
  subjectId?: string | null;
  projectId?: string | null;
  assigneeId?: string | null;
  assigneeIds?: string[];
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  tagNames?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  subjectId?: string | null;
  projectId?: string | null;
  assigneeId?: string | null;
  assigneeIds?: string[];
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  tagNames?: string[];
}

export interface TaskFilter {
  subjectId?: string;
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TaskTagDto {
  id: string;
  name: string;
  color: string | null;
}

export interface TaskAssigneeUserDto {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface TaskResponseDto {
  id: string;
  userId: string;
  subjectId: string | null;
  projectId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  completedAt: Date | null;
  tags: TaskTagDto[];
  assignees: TaskAssigneeUserDto[];
  assignee?: TaskAssigneeUserDto | null;
  canComplete?: boolean;
  canEdit?: boolean;
  subject?: {
    id: string;
    name: string;
    code?: string | null;
    color?: string | null;
  } | null;
  project?: {
    id: string;
    name: string;
    members?: any[];
  } | null;
  createdAt: Date;
  updatedAt: Date;
}
