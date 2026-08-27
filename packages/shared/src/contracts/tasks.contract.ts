import { TaskStatus, TaskPriority } from '../enums';

export interface CreateTaskDto {
  title: string;
  description?: string;
  subjectId?: string;
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  tagNames?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  subjectId?: string;
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  tagNames?: string[];
}

export interface TaskFilter {
  subjectId?: string;
  projectId?: string;
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

export interface TaskResponseDto {
  id: string;
  userId: string;
  subjectId: string | null;
  projectId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | string | null;
  completedAt: Date | string | null;
  tags: TaskTagDto[];
  createdAt: Date | string;
  updatedAt: Date | string;
}
