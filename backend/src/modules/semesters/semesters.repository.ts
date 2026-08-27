import { prisma } from '../../shared/db/prismaClient';
import { Semester } from '@prisma/client';
import { CreateSemesterDto, UpdateSemesterDto } from './semesters.types';

export class SemestersRepository {
  async findByUserId(userId: string): Promise<Semester[]> {
    return prisma.semester.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isCurrent: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { subjects: true }
        }
      }
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Semester | null> {
    return prisma.semester.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        subjects: {
          where: { deletedAt: null }
        }
      }
    });
  }

  async unsetOtherCurrentSemesters(userId: string, currentSemesterId?: string): Promise<void> {
    await prisma.semester.updateMany({
      where: {
        userId,
        id: currentSemesterId ? { not: currentSemesterId } : undefined,
        isCurrent: true
      },
      data: { isCurrent: false }
    });
  }

  async create(userId: string, data: CreateSemesterDto): Promise<Semester> {
    if (data.isCurrent) {
      await this.unsetOtherCurrentSemesters(userId);
    }

    return prisma.semester.create({
      data: {
        userId,
        name: data.name,
        academicYear: data.academicYear,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isCurrent: data.isCurrent ?? false,
        status: data.status ?? 'ACTIVE'
      }
    });
  }

  async update(id: string, userId: string, data: UpdateSemesterDto): Promise<Semester> {
    if (data.isCurrent) {
      await this.unsetOtherCurrentSemesters(userId, id);
    }

    return prisma.semester.update({
      where: { id },
      data: {
        name: data.name,
        academicYear: data.academicYear,
        startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
        endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined,
        isCurrent: data.isCurrent,
        status: data.status
      }
    });
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await prisma.semester.updateMany({
      where: { id, userId },
      data: { deletedAt: new Date() }
    });
  }
}
