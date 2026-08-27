import { ProjectStatus } from '@prisma/client';

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
  startDate: Date | null;
  dueDate: Date | null;
  notesCount?: number;
  tasksCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
