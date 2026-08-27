import { TaskPriority, TaskStatus } from '../enums';

export interface CreateTaskDto {
  title: string;
  description?: string;
  subjectId?: string;
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | Date;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | Date;
}

export interface TaskResponseDto {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  subjectId?: string | null;
  projectId?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}
