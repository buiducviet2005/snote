import { prisma } from '../../shared/db/prismaClient';
import { CreateTaskDto, UpdateTaskDto, TaskFilter } from './tasks.types';

export class TasksRepository {
  async findMany(userId: string, filter?: TaskFilter): Promise<{ tasks: any[]; total: number }> {
    const page = filter?.page || 1;
    const limit = filter?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      deletedAt: null,
      subjectId: filter?.subjectId || undefined,
      projectId: filter?.projectId || undefined,
      status: filter?.status || undefined,
      priority: filter?.priority || undefined
    };

    if (filter?.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } }
      ];
    }

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          subject: {
            select: { id: true, name: true, code: true, color: true }
          },
          project: {
            select: { id: true, name: true }
          },
          taskTags: {
            include: { tag: true }
          }
        }
      })
    ]);

    return { tasks, total };
  }

  async findById(id: string, userId: string): Promise<any | null> {
    return prisma.task.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true }
        },
        project: {
          select: { id: true, name: true }
        },
        taskTags: {
          include: { tag: true }
        }
      }
    });
  }

  private async getOrCreateTags(userId: string, tagNames: string[]): Promise<string[]> {
    const tagIds: string[] = [];
    for (const name of tagNames) {
      const cleanName = name.trim();
      if (!cleanName) continue;
      const tag = await prisma.tag.upsert({
        where: { userId_name: { userId, name: cleanName } },
        update: {},
        create: { userId, name: cleanName }
      });
      tagIds.push(tag.id);
    }
    return tagIds;
  }

  async create(userId: string, data: CreateTaskDto): Promise<any> {
    let tagIds: string[] = [];
    if (data.tagNames && data.tagNames.length > 0) {
      tagIds = await this.getOrCreateTags(userId, data.tagNames);
    }

    return prisma.task.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        subjectId: data.subjectId || null,
        projectId: data.projectId || null,
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        taskTags: {
          create: tagIds.map((tagId) => ({ tagId }))
        }
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true }
        },
        project: {
          select: { id: true, name: true }
        },
        taskTags: {
          include: { tag: true }
        }
      }
    });
  }

  async update(id: string, userId: string, data: UpdateTaskDto): Promise<any> {
    let taskTagsUpdate: any = undefined;

    if (data.tagNames !== undefined) {
      const tagIds = await this.getOrCreateTags(userId, data.tagNames);
      taskTagsUpdate = {
        deleteMany: {},
        create: tagIds.map((tagId) => ({ tagId }))
      };
    }

    const isCompleted = data.status === 'DONE';

    return prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        subjectId: data.subjectId !== undefined ? (data.subjectId || null) : undefined,
        projectId: data.projectId !== undefined ? (data.projectId || null) : undefined,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
        completedAt: isCompleted ? new Date() : (data.status ? null : undefined),
        taskTags: taskTagsUpdate
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true }
        },
        project: {
          select: { id: true, name: true }
        },
        taskTags: {
          include: { tag: true }
        }
      }
    });
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await prisma.task.updateMany({
      where: { id, userId },
      data: { deletedAt: new Date() }
    });
  }
}
