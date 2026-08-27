import { ProjectStatus } from '../enums';

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
  createdAt: Date | string;
  updatedAt: Date | string;
}
