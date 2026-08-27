import { prisma } from '../../shared/db/prismaClient';
import { Project, ProjectMember, ProjectMemberRole } from '@prisma/client';
import { CreateProjectDto, UpdateProjectDto } from './projects.types';

export class ProjectsRepository {
  async findByUserId(userId: string, semesterId?: string, subjectId?: string): Promise<any[]> {
    return prisma.project.findMany({
      where: {
        OR: [
          { userId },
          { members: { some: { userId } } }
        ],
        semesterId: semesterId || undefined,
        subjectId: subjectId || undefined,
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { notes: true, tasks: true, members: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, email: true, fullName: true, avatarUrl: true }
            }
          }
        }
      }
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<any | null> {
    return prisma.project.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { members: { some: { userId } } }
        ],
        deletedAt: null
      },
      include: {
        _count: {
          select: { notes: true, tasks: true, members: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, email: true, fullName: true, avatarUrl: true }
            }
          }
        }
      }
    });
  }

  async create(userId: string, data: CreateProjectDto): Promise<any> {
    return prisma.project.create({
      data: {
        userId,
        semesterId: data.semesterId,
        subjectId: data.subjectId,
        name: data.name,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: data.status ?? 'ACTIVE',
        members: {
          create: [
            { userId, role: 'OWNER' }
          ]
        }
      },
      include: {
        _count: {
          select: { notes: true, tasks: true, members: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, email: true, fullName: true, avatarUrl: true }
            }
          }
        }
      }
    });
  }

  async update(id: string, userId: string, data: UpdateProjectDto): Promise<any> {
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
      },
      include: {
        _count: {
          select: { notes: true, tasks: true, members: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, email: true, fullName: true, avatarUrl: true }
            }
          }
        }
      }
    });
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await prisma.project.updateMany({
      where: { id, userId },
      data: { deletedAt: new Date() }
    });
  }

  async addMember(projectId: string, targetUserId: string, role: ProjectMemberRole = 'MEMBER'): Promise<ProjectMember> {
    return prisma.projectMember.upsert({
      where: {
        projectId_userId: { projectId, userId: targetUserId }
      },
      update: { role },
      create: {
        projectId,
        userId: targetUserId,
        role
      }
    });
  }

  async removeMember(projectId: string, targetUserId: string): Promise<void> {
    await prisma.projectMember.deleteMany({
      where: { projectId, userId: targetUserId }
    });
  }
}
