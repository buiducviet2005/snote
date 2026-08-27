import { SemesterStatus } from '@prisma/client';

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
  startDate: Date | null;
  endDate: Date | null;
  status: SemesterStatus;
  isCurrent: boolean;
  subjectsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
