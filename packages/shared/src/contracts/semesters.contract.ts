import { SemesterStatus } from '../enums';

export interface CreateSemesterDto {
  name: string;
  academicYear: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  status?: SemesterStatus;
}

export interface UpdateSemesterDto {
  name?: string;
  academicYear?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  status?: SemesterStatus;
}

export interface SemesterResponseDto {
  id: string;
  name: string;
  academicYear: string;
  startDate: Date | string | null;
  endDate: Date | string | null;
  status: SemesterStatus;
  isCurrent: boolean;
  subjectsCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}
