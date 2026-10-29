import { prisma } from '../../shared/db/prismaClient';
import { Project, ProjectMember, ProjectMemberRole, WorkspaceRole } from '@prisma/client';
import { CreateProjectDto, UpdateProjectDto } from './projects.types';
import { ConflictError } from '../../shared/errors/appErrors';

const workspaceRole = (role: ProjectMemberRole): WorkspaceRole =>
  role === 'ADMIN' ? 'MANAGER' : role;

export class ProjectsRepository {
  constructor(private readonly db: typeof prisma = prisma) {}

  async findByUserId(userId: string, semesterId?: string, subjectId?: string): Promise<any[]> {
    return this.db.project.findMany({
      where: {
        OR: [
          { userId },
          { members: { some: { userId, status: 'ACCEPTED' } } },
          { workspace: { ownerId: userId } },
          { workspace: { members: { some: { userId, status: 'ACCEPTED' } } } },
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
        workspace: {
          include: {
            members: {
              where: { status: 'ACCEPTED' },
              include: {
                user: {
                  select: { id: true, email: true, fullName: true, avatarUrl: true }
                }
              }
            }
          }
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
    return this.db.project.findMany({
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
    return this.db.$transaction(async (tx) => {
      const where = { projectId, userId, status: 'PENDING' as const, project: { classId: null, deletedAt: null } };
      if (!accept) return tx.projectMember.deleteMany({ where });
      const result = await tx.projectMember.updateMany({
        where, data: { status: 'ACCEPTED', joinedAt: new Date() }
      });
      if (!result.count) return result;
      const project = await tx.project.findUnique({
        where: { id: projectId }, select: { workspace: { select: { id: true } } }
      });
      if (project?.workspace) {
        const member = await tx.projectMember.findUniqueOrThrow({
          where: { projectId_userId: { projectId, userId } }, select: { role: true }
        });
        await tx.workspaceMember.upsert({
          where: { workspaceId_userId: { workspaceId: project.workspace.id, userId } },
          create: { workspaceId: project.workspace.id, userId, role: workspaceRole(member.role), status: 'ACCEPTED', joinedAt: new Date() },
          update: { role: workspaceRole(member.role), status: 'ACCEPTED', joinedAt: new Date() }
        });
      }
      return result;
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<any | null> {
    return this.db.project.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { members: { some: { userId, status: 'ACCEPTED' } } },
          { workspace: { ownerId: userId } },
          { workspace: { members: { some: { userId, status: 'ACCEPTED' } } } },
          { courseClass: { teacherId: userId, deletedAt: null } },
          { courseClass: { members: { some: { userId, role: 'CLASS_ADMIN' } }, deletedAt: null } }
        ],
        deletedAt: null
      },
      include: {
        _count: {
          select: { notes: true, tasks: true, members: true }
        },
        workspace: {
          include: {
            members: {
              where: { status: 'ACCEPTED' },
              include: {
                user: {
                  select: { id: true, email: true, fullName: true, avatarUrl: true }
                }
              }
            }
          }
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
    return this.db.project.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { members: { some: { userId, status: 'ACCEPTED' } } },
          { workspace: { ownerId: userId } },
          { workspace: { members: { some: { userId, status: 'ACCEPTED' } } } },
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
        workspace: {
          include: {
            members: {
              where: { status: 'ACCEPTED' },
              include: {
                user: {
                  select: { id: true, email: true, fullName: true, avatarUrl: true }
                }
              }
            }
          }
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
    return this.db.project.create({
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
    return this.db.project.update({
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
    await this.db.project.updateMany({
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
    return this.db.$transaction(async (tx) => {
      const key = { projectId_userId: { projectId, userId: targetUserId } };
      const existing = await tx.projectMember.findUnique({ where: key });
      if (existing && existing.status !== 'DECLINED') {
        throw new ConflictError('Người này đã là thành viên hoặc đã có lời mời đang chờ');
      }
      return tx.projectMember.upsert({
        where: key,
        update: { role, status },
        create: { projectId, userId: targetUserId, role, status }
      });
    });
  }

  async updateMemberRole(projectId: string, targetUserId: string, role: ProjectMemberRole, oldOwnerId: string): Promise<ProjectMember> {
    return this.db.$transaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({
        where: { id: projectId }, select: { workspace: { select: { id: true } } }
      });
      if (role === 'OWNER' && oldOwnerId !== targetUserId) {
        const transferred = await tx.project.updateMany({
          where: { id: projectId, userId: oldOwnerId }, data: { userId: targetUserId }
        });
        if (!transferred.count) throw new ConflictError('Chủ dự án đã thay đổi; hãy tải lại danh sách thành viên');
        await tx.projectMember.updateMany({
          where: { projectId, userId: oldOwnerId, status: 'ACCEPTED' }, data: { role: 'MEMBER' }
        });
        if (project.workspace) {
          await tx.workspace.update({ where: { id: project.workspace.id }, data: { ownerId: targetUserId } });
          await tx.workspaceMember.updateMany({
            where: { workspaceId: project.workspace.id, userId: oldOwnerId }, data: { role: 'MEMBER' }
          });
        }
      }
      const member = await tx.projectMember.upsert({
        where: { projectId_userId: { projectId, userId: targetUserId } },
        update: { role },
        create: { projectId, userId: targetUserId, role, status: 'ACCEPTED' }
      });
      if (project.workspace) {
        await tx.workspaceMember.upsert({
          where: { workspaceId_userId: { workspaceId: project.workspace.id, userId: targetUserId } },
          create: { workspaceId: project.workspace.id, userId: targetUserId, role: workspaceRole(role), status: 'ACCEPTED', joinedAt: new Date() },
          update: { role: workspaceRole(role), status: 'ACCEPTED' }
        });
      }
      return member;
    });
  }

  async removeMember(projectId: string, targetUserId: string): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({
        where: { id: projectId }, select: { userId: true, workspace: { select: { id: true } } }
      });
      await tx.taskAssignee.deleteMany({ where: { userId: targetUserId, task: { projectId } } });
      await tx.task.updateMany({ where: { projectId, userId: targetUserId }, data: { userId: project.userId } });
      await tx.projectMember.deleteMany({ where: { projectId, userId: targetUserId } });
      if (project.workspace) {
        await tx.workspaceMember.deleteMany({ where: { workspaceId: project.workspace.id, userId: targetUserId } });
      }
    });
  }
}
