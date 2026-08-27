import { prisma } from '../../shared/db/prismaClient';
import { Project } from '@prisma/client';
import { CreateProjectDto, UpdateProjectDto } from './projects.types';

export class ProjectsRepository {
  async findByUserId(userId: string, semesterId?: string, subjectId?: string): Promise<Project[]> {
    return prisma.project.findMany({
      where: {
        userId,
        semesterId: semesterId || undefined,
        subjectId: subjectId || undefined,
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { notes: true, tasks: true }
        }
      }
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Project | null> {
    return prisma.project.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        _count: {
          select: { notes: true, tasks: true }
        }
      }
    });
  }

  async create(userId: string, data: CreateProjectDto): Promise<Project> {
    return prisma.project.create({
      data: {
        userId,
        semesterId: data.semesterId,
        subjectId: data.subjectId,
        name: data.name,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: data.status ?? 'ACTIVE'
      }
    });
  }

  async update(id: string, userId: string, data: UpdateProjectDto): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data: {
        semesterId: data.semesterId,
        subjectId: data.subjectId,
        name: data.name,
        description: data.description,
        startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
        dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
        status: data.status
      }
    });
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await prisma.project.updateMany({
      where: { id, userId },
      data: { deletedAt: new Date() }
    });
  }
}
