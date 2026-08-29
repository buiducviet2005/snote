import { prisma } from '../../shared/db/prismaClient';
import { GlobalSearchQueryDto, GlobalSearchResultDto, SearchResultItem } from './search.types';
import { TaskStatus, TaskPriority, ProjectStatus, ScheduleEventType } from '@prisma/client';

export class SearchService {
  async search(userId: string, query: GlobalSearchQueryDto): Promise<GlobalSearchResultDto> {
    const q = query.q?.trim() || '';
    const limit = Math.min(query.limit || 20, 50);
    const types = query.itemTypes ? query.itemTypes.split(',').map((t) => t.trim().toLowerCase()) : ['notes', 'tasks', 'projects', 'schedule'];

    const searchNotes = types.includes('notes') || types.includes('note');
    const searchTasks = types.includes('tasks') || types.includes('task');
    const searchProjects = types.includes('projects') || types.includes('project');
    const searchSchedule = types.includes('schedule') || types.includes('events') || types.includes('event');

    // Date range filter
    const createdDateFilter: any = {};
    if (query.startDate) createdDateFilter.gte = new Date(query.startDate);
    if (query.endDate) createdDateFilter.lte = new Date(query.endDate);
    const hasDateFilter = Object.keys(createdDateFilter).length > 0;

    // Find notes shared with user
    const sharedNoteIds = await prisma.resourceShare.findMany({
      where: {
        targetType: 'NOTE',
        OR: [{ sharedWithUserId: userId }, { isPublic: true }]
      },
      select: { targetId: true }
    }).then((shares) => shares.map((s) => s.targetId));

    // Parallel searches
    const [notesData, tasksData, projectsData, scheduleData] = await Promise.all([
      // 1. NOTES SEARCH
      searchNotes
        ? prisma.note.findMany({
            where: {
              OR: [
                { userId, deletedAt: null },
                { id: { in: sharedNoteIds }, deletedAt: null }
              ],
              ...(q
                ? {
                    OR: [
                      { title: { contains: q, mode: 'insensitive' } },
                      { content: { contains: q, mode: 'insensitive' } }
                    ]
                  }
                : {}),
              ...(query.subjectId ? { subjectId: query.subjectId } : {}),
              ...(query.semesterId ? { subject: { semesterId: query.semesterId } } : {}),
              ...(query.tagId ? { noteTags: { some: { tagId: query.tagId } } } : {}),
              ...(query.isPinned !== undefined ? { isPinned: query.isPinned } : {}),
              ...(hasDateFilter ? { createdAt: createdDateFilter } : {})
            },
            include: {
              subject: { select: { id: true, name: true, code: true, color: true } },
              noteTags: { include: { tag: true } }
            },
            orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
            take: limit
          })
        : [],

      // 2. TASKS SEARCH
      searchTasks
        ? prisma.task.findMany({
            where: {
              userId,
              deletedAt: null,
              ...(q
                ? {
                    OR: [
                      { title: { contains: q, mode: 'insensitive' } },
                      { description: { contains: q, mode: 'insensitive' } }
                    ]
                  }
                : {}),
              ...(query.subjectId ? { subjectId: query.subjectId } : {}),
              ...(query.semesterId ? { subject: { semesterId: query.semesterId } } : {}),
              ...(query.status ? { status: query.status as TaskStatus } : {}),
              ...(query.priority ? { priority: query.priority as TaskPriority } : {}),
              ...(query.tagId ? { taskTags: { some: { tagId: query.tagId } } } : {}),
              ...(hasDateFilter ? { createdAt: createdDateFilter } : {})
            },
            include: {
              subject: { select: { id: true, name: true, code: true, color: true } },
              taskTags: { include: { tag: true } }
            },
            orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
            take: limit
          })
        : [],

      // 3. PROJECTS SEARCH
      searchProjects
        ? prisma.project.findMany({
            where: {
              OR: [{ userId }, { members: { some: { userId } } }],
              deletedAt: null,
              ...(q
                ? {
                    OR: [
                      { name: { contains: q, mode: 'insensitive' } },
                      { description: { contains: q, mode: 'insensitive' } }
                    ]
                  }
                : {}),
              ...(query.subjectId ? { subjectId: query.subjectId } : {}),
              ...(query.semesterId ? { semesterId: query.semesterId } : {}),
              ...(query.status ? { status: query.status as ProjectStatus } : {}),
              ...(hasDateFilter ? { createdAt: createdDateFilter } : {})
            },
            include: {
              subject: { select: { id: true, name: true, code: true, color: true } }
            },
            orderBy: { updatedAt: 'desc' },
            take: limit
          })
        : [],

      // 4. SCHEDULE EVENTS SEARCH
      searchSchedule
        ? prisma.scheduleEvent.findMany({
            where: {
              userId,
              deletedAt: null,
              ...(q
                ? {
                    OR: [
                      { title: { contains: q, mode: 'insensitive' } },
                      { location: { contains: q, mode: 'insensitive' } }
                    ]
                  }
                : {}),
              ...(query.subjectId ? { subjectId: query.subjectId } : {}),
              ...(query.semesterId ? { semesterId: query.semesterId } : {}),
              ...(query.status ? { eventType: query.status as ScheduleEventType } : {}),
              ...(hasDateFilter ? { startTime: createdDateFilter } : {})
            },
            include: {
              subject: { select: { id: true, name: true, code: true, color: true } }
            },
            orderBy: { startTime: 'asc' },
            take: limit
          })
        : []
    ]);

    const formattedNotes: SearchResultItem[] = notesData.map((n: any) => ({
      id: n.id,
      type: 'NOTE',
      title: n.title,
      snippet: n.content ? n.content.slice(0, 160).replace(/[#*`_]/g, '') : '',
      subject: n.subject,
      isPinned: n.isPinned,
      tags: (n.noteTags || []).map((nt: any) => nt.tag?.name).filter(Boolean),
      createdAt: n.createdAt,
      updatedAt: n.updatedAt
    }));

    const formattedTasks: SearchResultItem[] = tasksData.map((t: any) => ({
      id: t.id,
      type: 'TASK',
      title: t.title,
      snippet: t.description || '',
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      tags: (t.taskTags || []).map((tt: any) => tt.tag?.name).filter(Boolean),
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    }));

    const formattedProjects: SearchResultItem[] = projectsData.map((p: any) => ({
      id: p.id,
      type: 'PROJECT',
      title: p.name,
      snippet: p.description || '',
      subject: p.subject,
      status: p.status,
      dueDate: p.dueDate,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    const formattedSchedule: SearchResultItem[] = scheduleData.map((s: any) => ({
      id: s.id,
      type: 'SCHEDULE_EVENT',
      title: s.title,
      snippet: s.location ? `Địa điểm: ${s.location}` : '',
      subject: s.subject,
      status: s.eventType,
      startTime: s.startTime,
      endTime: s.endTime,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    }));

    const totalCount = formattedNotes.length + formattedTasks.length + formattedProjects.length + formattedSchedule.length;

    return {
      notes: formattedNotes,
      tasks: formattedTasks,
      projects: formattedProjects,
      scheduleEvents: formattedSchedule,
      totalCount
    };
  }
}
