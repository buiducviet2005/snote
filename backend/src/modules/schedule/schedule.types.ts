import { ScheduleEventType } from '@prisma/client';

export interface CreateScheduleEventDto {
  semesterId?: string;
  subjectId?: string;
  title: string;
  location?: string;
  eventType?: ScheduleEventType;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
}

export interface UpdateScheduleEventDto {
  semesterId?: string;
  subjectId?: string;
  title?: string;
  location?: string;
  eventType?: ScheduleEventType;
  startTime?: string;
  endTime?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
}

export interface ScheduleEventResponseDto {
  id: string;
  semesterId: string | null;
  subjectId: string | null;
  title: string;
  location: string | null;
  eventType: ScheduleEventType;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  recurrenceRule: string | null;
  createdAt: Date;
  updatedAt: Date;
}
