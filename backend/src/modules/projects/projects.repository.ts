import { prisma } from '../../shared/db/prismaClient';
import { Project, ProjectMember, ProjectMemberRole } from '@prisma/client';
import { CreateProjectDto, UpdateProjectDto } from './projects.types';

export class ProjectsRepository {
  async findByUserId(userId: string, semesterId?: string, subjectId?: string): Promise<any[]> {
    return prisma.project.findMany({
      where: {
        OR: [
          { userId },
          { members: { some: { userId, status: 'ACCEPTED' } } },
          { courseClass: { teacherId: userId, deletedAt: null } },
          { courseClass: { members: { some: { userId, role: 'CLASS_ADMIN' } }, deletedAt: null } }
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

  async findInvitations(userId: string): Promise<any[]> {
    return prisma.project.findMany({
      where: {
        deletedAt: null,
        classId: null,
        members: {
          some: {
            userId,
            status: 'PENDING'
          }
        }
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true }
        },
        subject: {
          select: { id: true, name: true, code: true, color: true }
        },
        members: {
          where: { userId },
          select: { id: true, role: true, status: true, joinedAt: true }
        }
      }
    });
  }

  async respondToInvitation(projectId: string, userId: string, accept: boolean): Promise<any> {
    if (accept) {
      return prisma.projectMember.updateMany({
        where: { projectId, userId, status: 'PENDING', project: { classId: null, deletedAt: null } },
        data: { status: 'ACCEPTED', joinedAt: new Date() }
      });
    } else {
      return prisma.projectMember.deleteMany({
        where: { projectId, userId, status: 'PENDING', project: { classId: null, deletedAt: null } }
      });
    }
  }

  async findByIdAndUserId(id: string, userId: string): Promise<any | null> {
    return prisma.project.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { members: { some: { userId, status: 'ACCEPTED' } } },
          { courseClass: { teacherId: userId, deletedAt: null } },
          { courseClass: { members: { some: { userId, role: 'CLASS_ADMIN' } }, deletedAt: null } }
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

  async findWorkspaceById(id: string, userId: string): Promise<any | null> {
    return prisma.project.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { members: { some: { userId, status: 'ACCEPTED' } } },
          { courseClass: { teacherId: userId, deletedAt: null } },
          { courseClass: { members: { some: { userId, role: 'CLASS_ADMIN' } }, deletedAt: null } }
        ],
        deletedAt: null
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true }
        },
        semester: {
          select: { id: true, name: true, academicYear: true }
        },
        _count: {
          select: { notes: true, tasks: true, members: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, email: true, fullName: true, avatarUrl: true }
            }
          },
          orderBy: { role: 'asc' }
        },
        notes: {
          where: { deletedAt: null },
          orderBy: [
            { isPinned: 'desc' },
            { createdAt: 'desc' }
          ],
          include: {
            noteTags: {
              include: { tag: true }
            },
            user: {
              select: { id: true, fullName: true, email: true }
            }
          }
        },
        tasks: {
          where: { deletedAt: null },
          orderBy: [
            { dueDate: 'asc' },
            { priority: 'desc' },
            { createdAt: 'desc' }
          ],
          include: {
            taskTags: {
              include: { tag: true }
            },
            user: {
              select: { id: true, fullName: true, email: true }
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
            { userId, role: 'OWNER', status: 'ACCEPTED' }
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

  async addMember(
    projectId: string,
    targetUserId: string,
    role: ProjectMemberRole = 'MEMBER',
    status: 'PENDING' | 'ACCEPTED' = 'PENDING'
  ): Promise<ProjectMember> {
    return prisma.projectMember.upsert({
      where: {
        projectId_userId: { projectId, userId: targetUserId }
      },
      update: { role, status },
      create: {
        projectId,
        userId: targetUserId,
        role,
        status
      }
    });
  }

  async updateMemberRole(projectId: string, targetUserId: string, role: ProjectMemberRole): Promise<ProjectMember> {
    return prisma.projectMember.update({
      where: {
        projectId_userId: { projectId, userId: targetUserId }
      },
      data: { role }
    });
  }

  async removeMember(projectId: string, targetUserId: string): Promise<void> {
    await prisma.projectMember.deleteMany({
      where: { projectId, userId: targetUserId }
    });
  }
}
