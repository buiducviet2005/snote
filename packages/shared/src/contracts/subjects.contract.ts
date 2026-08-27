import { SubjectStatus } from '../enums';

export interface CreateSubjectDto {
  semesterId: string;
  name: string;
  code?: string;
  credits?: number;
  lecturer?: string;
  color?: string;
  status?: SubjectStatus;
}

export interface UpdateSubjectDto {
  semesterId?: string;
  name?: string;
  code?: string;
  credits?: number;
  lecturer?: string;
  color?: string;
  status?: SubjectStatus;
}

export interface SubjectResponseDto {
  id: string;
  semesterId: string;
  name: string;
  code: string | null;
  credits: number;
  lecturer: string | null;
  color: string | null;
  status: SubjectStatus;
  notesCount?: number;
  tasksCount?: number;
  projectsCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}
