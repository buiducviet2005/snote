import { prisma } from '../../shared/db/prismaClient';
import { Subject } from '@prisma/client';
import { CreateSubjectDto, UpdateSubjectDto } from './subjects.types';

export class SubjectsRepository {
  async findByUserId(userId: string, semesterId?: string): Promise<Subject[]> {
    return prisma.subject.findMany({
      where: {
        userId,
        semesterId: semesterId || undefined,
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { notes: true, tasks: true, projects: true }
        }
      }
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Subject | null> {
    return prisma.subject.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        _count: {
          select: { notes: true, tasks: true, projects: true }
        }
      }
    });
  }

  async create(userId: string, data: CreateSubjectDto): Promise<Subject> {
    return prisma.subject.create({
      data: {
        userId,
        semesterId: data.semesterId,
        name: data.name,
        code: data.code,
        credits: data.credits ?? 3,
        lecturer: data.lecturer,
        color: data.color ?? '#3b82f6',
        status: data.status ?? 'ACTIVE'
      }
    });
  }

  async update(id: string, userId: string, data: UpdateSubjectDto): Promise<Subject> {
    return prisma.subject.update({
      where: { id },
      data: {
        semesterId: data.semesterId,
        name: data.name,
        code: data.code,
        credits: data.credits,
        lecturer: data.lecturer,
        color: data.color,
        status: data.status
      }
    });
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await prisma.subject.updateMany({
      where: { id, userId },
      data: { deletedAt: new Date() }
    });
  }
}
