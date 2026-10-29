import { prisma } from '../../shared/db/prismaClient';
import { ScheduleEvent } from '@prisma/client';
import { CreateScheduleEventDto, UpdateScheduleEventDto, UnifiedScheduleItemDto } from './schedule.types';
import { visibleTasks } from '../../shared/security/studyAccess';

export class ScheduleRepository {
  async findUnifiedSchedule(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    semesterId?: string,
    subjectId?: string,
    scope?: { id: string; type: 'PERSONAL' | 'SUBJECT' | 'PROJECT' | 'GROUP'; subjectId: string | null; projectId: string | null }
  ): Promise<UnifiedScheduleItemDto[]> {
    const eventWhere: any = {
      userId,
      deletedAt: null,
      semesterId: semesterId || undefined,
      subjectId: subjectId || undefined
    };
    if (scope?.type === 'PERSONAL') eventWhere.subjectId = null;
    if (scope?.type === 'SUBJECT') eventWhere.subjectId = scope.subjectId;
    if (scope?.type === 'PERSONAL') {
      eventWhere.projectId = null;
      eventWhere.OR = [{ workspaceId: null }, { workspace: { type: 'PERSONAL' } }];
    }
    if (scope?.type === 'SUBJECT') eventWhere.projectId = null;
    if (scope?.type === 'PROJECT') eventWhere.projectId = scope.projectId;
    if (scope?.type === 'GROUP') {
      delete eventWhere.userId;
      eventWhere.workspaceId = scope.id;
    }

    if (startDate && endDate) {
      eventWhere.startTime = { gte: startDate, lte: endDate };
    }

    // 1. Fetch Calendar Events
    const events = await prisma.scheduleEvent.findMany({
      where: eventWhere,
      orderBy: { startTime: 'asc' },
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true }
        }
      }
    });

    const unifiedList: UnifiedScheduleItemDto[] = events.map((e: any) => ({
      id: e.id,
      userId: e.userId,
      itemType: 'EVENT',
      title: e.title,
      location: e.location,
      eventType: e.eventType,
      startTime: e.startTime,
      endTime: e.endTime,
      isRecurring: e.isRecurring,
      recurrenceRule: e.recurrenceRule,
      subjectId: e.subjectId,
      projectId: e.projectId,
      subject: e.subject
    }));

    // 2. Fetch Tasks with due date in range
    // 2. Fetch Tasks with due date in range or created in range
    if (startDate && endDate) {
      const taskWhere: any = {
          AND: [visibleTasks(userId)],
          deletedAt: null,
          dueDate: { gte: startDate, lte: endDate },
          subjectId: subjectId || undefined
      };
      if (scope?.type === 'PERSONAL') taskWhere.AND.push({ OR: [{ userId }, { assignees: { some: { userId } } }] });
      if (scope?.type === 'SUBJECT') taskWhere.subjectId = scope.subjectId;
      if (scope?.type === 'PROJECT') taskWhere.projectId = scope.projectId;
      if (scope?.type === 'GROUP') taskWhere.workspaceId = scope.id;
      const tasks = await prisma.task.findMany({
        where: taskWhere,
        include: {
          user: {
            select: { id: true, fullName: true, avatarUrl: true }
          },
          assignees: {
            include: {
              user: {
                select: { id: true, fullName: true, avatarUrl: true }
              }
            }
          },
          subject: {
            select: { id: true, name: true, code: true, color: true }
          },
          project: {
            select: { id: true, name: true }
          }
        }
      });

      for (const t of tasks) {
        if (t.dueDate) {
          const assigneesList = (t.assignees || []).map((ta: any) => ({
            id: ta.user?.id || ta.userId,
            name: ta.user?.fullName || 'Thành viên',
            avatarUrl: ta.user?.avatarUrl
          }));
          if (assigneesList.length === 0 && t.user) {
            assigneesList.push({
              id: t.user.id,
              name: t.user.fullName,
              avatarUrl: t.user.avatarUrl
            });
          }

          unifiedList.push({
            id: t.id,
            itemType: 'TASK',
            title: t.title,
            description: t.description,
            location: t.project ? `Đồ án: ${t.project.name}` : undefined,
            eventType: 'DEADLINE',
            startTime: t.createdAt && t.createdAt < t.dueDate ? t.createdAt : t.dueDate,
            endTime: t.dueDate,
            dueDate: t.dueDate,
            createdAt: t.createdAt,
            status: t.status,
            priority: t.priority,
            subjectId: t.subjectId,
            projectId: t.projectId,
            assignees: assigneesList,
            subject: t.subject,
            project: t.project
          });
        }
      }

      // 3. Fetch Projects with due date in range
      const projects = await prisma.project.findMany({
        where: {
          OR: [
            { userId },
            { members: { some: { userId, status: 'ACCEPTED' } } },
            { courseClass: { teacherId: userId, deletedAt: null } },
            { courseClass: { members: { some: { userId, role: 'CLASS_ADMIN' } }, deletedAt: null } }
          ],
          deletedAt: null,
          dueDate: { gte: startDate, lte: endDate },
          subjectId: scope?.type === 'SUBJECT' ? scope.subjectId : subjectId || undefined,
          id: scope?.type === 'PROJECT' ? scope.projectId! : undefined,
          ...(scope?.type === 'GROUP' || scope?.type === 'PERSONAL' ? { id: { in: [] } } : {})
        },
        include: {
          subject: {
            select: { id: true, name: true, code: true, color: true }
          }
        }
      });

      for (const p of projects) {
        if (p.dueDate) {
          unifiedList.push({
            id: p.id,
            itemType: 'PROJECT',
            title: `[Hạn Đồ Án] ${p.name}`,
            description: p.description,
            location: p.description ? p.description.slice(0, 50) : undefined,
            eventType: 'DEADLINE',
            startTime: p.startDate || p.createdAt || p.dueDate,
            endTime: p.dueDate,
            dueDate: p.dueDate,
            createdAt: p.createdAt,
            status: p.status,
            subjectId: p.subjectId,
            projectId: p.id,
            subject: p.subject,
            project: { id: p.id, name: p.name }
          });
        }
      }
    }

    // Sort all events & deadlines chronologically
    return unifiedList.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  async findByIdAndUserId(id: string, userId: string): Promise<ScheduleEvent | null> {
    return prisma.scheduleEvent.findFirst({
      where: { id, deletedAt: null, OR: [{ userId }, { workspace: { type: 'GROUP', members: { some: { userId, status: 'ACCEPTED' } } } }] }
    });
  }

  async create(userId: string, data: CreateScheduleEventDto): Promise<ScheduleEvent> {
    return prisma.scheduleEvent.create({
      data: {
        userId,
        semesterId: data.semesterId || null,
        subjectId: data.subjectId || null,
        projectId: data.projectId || null,
        workspaceId: data.workspaceId || null,
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
        projectId: data.projectId !== undefined ? (data.projectId || null) : undefined,
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
