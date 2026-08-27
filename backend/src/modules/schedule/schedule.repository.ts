import { prisma } from '../../shared/db/prismaClient';
import { ScheduleEvent } from '@prisma/client';
import { CreateScheduleEventDto, UpdateScheduleEventDto } from './schedule.types';

export class ScheduleRepository {
  async findByRange(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    semesterId?: string,
    subjectId?: string
  ): Promise<ScheduleEvent[]> {
    const where: any = {
      userId,
      deletedAt: null,
      semesterId: semesterId || undefined,
      subjectId: subjectId || undefined
    };

    if (startDate && endDate) {
      where.startTime = { gte: startDate, lte: endDate };
    }

    return prisma.scheduleEvent.findMany({
      where,
      orderBy: { startTime: 'asc' }
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<ScheduleEvent | null> {
    return prisma.scheduleEvent.findFirst({
      where: { id, userId, deletedAt: null }
    });
  }

  async create(userId: string, data: CreateScheduleEventDto): Promise<ScheduleEvent> {
    return prisma.scheduleEvent.create({
      data: {
        userId,
        semesterId: data.semesterId || null,
        subjectId: data.subjectId || null,
        title: data.title,
        location: data.location || null,
        eventType: data.eventType || 'CLASS',
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        isRecurring: data.isRecurring ?? false,
        recurrenceRule: data.recurrenceRule || null
      }
    });
  }

  async update(id: string, userId: string, data: UpdateScheduleEventDto): Promise<ScheduleEvent> {
    return prisma.scheduleEvent.update({
      where: { id },
      data: {
        semesterId: data.semesterId !== undefined ? (data.semesterId || null) : undefined,
        subjectId: data.subjectId !== undefined ? (data.subjectId || null) : undefined,
        title: data.title,
        location: data.location,
        eventType: data.eventType,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        isRecurring: data.isRecurring,
        recurrenceRule: data.recurrenceRule
      }
    });
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await prisma.scheduleEvent.updateMany({
      where: { id, userId },
      data: { deletedAt: new Date() }
    });
  }
}
