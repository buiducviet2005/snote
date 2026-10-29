import type { Prisma, WorkspaceRole } from '@prisma/client';
import { NotFoundError, ConflictError } from '../../shared/errors/appErrors';
import { prisma } from '../../shared/db/prismaClient';
import type {
  CreateWorkspaceInput,
  CursorPayload,
  WorkspaceListInput
} from './workspaces.types';
import { workspaceMemberAccessWhere } from './workspaces.policy';

const workspaceRelations = {
  project: {
    select: {
      id: true,
      semesterId: true,
      subjectId: true,
      description: true,
      status: true,
      startDate: true,
      dueDate: true
    }
  },
  subject: {
    select: {
      id: true,
      semesterId: true,
      code: true
    }
  },
  group: {
    select: { id: true, classId: true, leaderId: true, courseClass: { select: { name: true } } }
  }
} satisfies Prisma.WorkspaceInclude;

const memberSelect = {
  id: true,
  workspaceId: true,
  userId: true,
  role: true,
  status: true,
  version: true,
  joinedAt: true,
  user: {
    select: {
      id: true,
      fullName: true,
      avatarUrl: true
    }
  }
} satisfies Prisma.WorkspaceMemberSelect;

export type WorkspaceRecord = Prisma.WorkspaceGetPayload<{
  include: typeof workspaceRelations;
}>;

export type ContextRecord = WorkspaceRecord & {
  members: Prisma.WorkspaceMemberGetPayload<{ select: typeof memberSelect }>[];
};

export type WorkspaceMemberRecord = Prisma.WorkspaceMemberGetPayload<{
  select: typeof memberSelect;
}>;

export interface WorkspaceRepositoryPort {
  findUserTimezone(userId: string): Promise<string | null>;
  findPersonalWorkspace(userId: string): Promise<{ id: string } | null>;
  findSubjectWorkspace(subjectId: string): Promise<{ id: string } | null>;
  findOwnedSubject(subjectId: string, userId: string): Promise<{ id: string } | null>;
  findOwnedSemester(semesterId: string, userId: string): Promise<{ id: string } | null>;
  findAcceptedContext(workspaceId: string, userId: string): Promise<ContextRecord | null>;
  listAcceptedWorkspaces(
    userId: string,
    filters: WorkspaceListInput,
    cursor: CursorPayload | null
  ): Promise<WorkspaceRecord[]>;
  listAcceptedMembers(
    workspaceId: string,
    actorId: string,
    cursor: CursorPayload | null,
    limit: number
  ): Promise<WorkspaceMemberRecord[]>;
  createPersonal(userId: string, name: string, timezone: string): Promise<ContextRecord>;
  createSubject(
    userId: string,
    name: string,
    timezone: string,
    subjectId: string
  ): Promise<ContextRecord>;
  createProject(
    userId: string,
    name: string,
    timezone: string,
    input: NonNullable<CreateWorkspaceInput['project']>
  ): Promise<ContextRecord>;
  addMember(
    workspaceId: string,
    actorId: string,
    email: string,
    role: WorkspaceRole
  ): Promise<WorkspaceMemberRecord>;
  listInvitations(userId: string): Promise<any[]>;
  acceptInvitation(memberId: string, userId: string): Promise<string>;
  declineInvitation(memberId: string, userId: string): Promise<void>;
  joinWorkspace(userId: string, codeOrId: string): Promise<string>;
  updateMemberRole(workspaceId: string, memberId: string, newRole: WorkspaceRole): Promise<WorkspaceMemberRecord>;
  removeMember(workspaceId: string, memberId: string): Promise<void>;
  getWorkspaceProgress(workspaceId: string): Promise<any>;
}

const contextInclude = {
  ...workspaceRelations,
  members: {
    select: memberSelect
  }
} satisfies Prisma.WorkspaceInclude;

export class WorkspaceRepository implements WorkspaceRepositoryPort {
  async findUserTimezone(userId: string): Promise<string | null> {
    const user = await prisma.user.findFirst({
      where: { id: userId, status: 'ACTIVE', deletedAt: null },
      select: { timezone: true }
    });
    return user?.timezone ?? null;
  }

  async findPersonalWorkspace(userId: string): Promise<{ id: string } | null> {
    return prisma.workspace.findFirst({
      where: { type: 'PERSONAL', ownerId: userId, deletedAt: null },
      select: { id: true }
    });
  }

  async findSubjectWorkspace(subjectId: string): Promise<{ id: string } | null> {
    return prisma.workspace.findFirst({
      where: { type: 'SUBJECT', subjectId, deletedAt: null },
      select: { id: true }
    });
  }

  async findOwnedSubject(subjectId: string, userId: string): Promise<{ id: string } | null> {
    return prisma.subject.findFirst({
      where: { id: subjectId, userId, status: { not: 'ARCHIVED' }, deletedAt: null },
      select: { id: true }
    });
  }

  async findOwnedSemester(semesterId: string, userId: string): Promise<{ id: string } | null> {
    return prisma.semester.findFirst({
      where: { id: semesterId, userId, deletedAt: null },
      select: { id: true }
    });
  }

  async findAcceptedContext(workspaceId: string, userId: string): Promise<ContextRecord | null> {
    return prisma.workspace.findFirst({
      where: workspaceMemberAccessWhere(workspaceId, userId),
      include: {
        ...workspaceRelations,
        members: {
          where: { userId, status: 'ACCEPTED' },
          select: memberSelect
        }
      }
    });
  }

  async listAcceptedWorkspaces(
    userId: string,
    filters: WorkspaceListInput,
    cursor: CursorPayload | null
  ): Promise<WorkspaceRecord[]> {
    const createdAt = cursor ? new Date(cursor.createdAt) : null;
    const cursorWhere: Prisma.WorkspaceWhereInput | undefined = cursor && createdAt
      ? {
          OR: [
            { createdAt: { lt: createdAt } },
            { createdAt, id: { lt: cursor.id } }
          ]
        }
      : undefined;

    return prisma.workspace.findMany({
      where: {
        deletedAt: null,
        type: filters.type,
        status: filters.status,
        members: {
          some: {
            userId,
            status: 'ACCEPTED',
            user: { status: 'ACTIVE', deletedAt: null }
          }
        },
        ...(cursorWhere ?? {})
      },
      include: workspaceRelations,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: filters.limit + 1
    });
  }

  async listAcceptedMembers(
    workspaceId: string,
    actorId: string,
    cursor: CursorPayload | null,
    limit: number
  ): Promise<WorkspaceMemberRecord[]> {
    const joinedAt = cursor ? new Date(cursor.createdAt) : null;
    return prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        status: 'ACCEPTED',
        user: { status: 'ACTIVE', deletedAt: null },
        workspace: workspaceMemberAccessWhere(workspaceId, actorId),
        ...(cursor && joinedAt
          ? {
              OR: [
                { joinedAt: { lt: joinedAt } },
                { joinedAt, id: { lt: cursor.id } }
              ]
            }
          : {})
      },
      select: memberSelect,
      orderBy: [{ joinedAt: 'desc' }, { id: 'desc' }],
      take: limit + 1
    });
  }

  async createPersonal(userId: string, name: string, timezone: string): Promise<ContextRecord> {
    const workspace = await prisma.workspace.create({
      data: {
        type: 'PERSONAL',
        name,
        ownerId: userId,
        timezone,
        members: {
          create: {
            userId,
            role: 'OWNER',
            status: 'ACCEPTED',
            joinedAt: new Date()
          }
        }
      },
      include: contextInclude
    });
    return workspace;
  }

  async createSubject(
    userId: string,
    name: string,
    timezone: string,
    subjectId: string
  ): Promise<ContextRecord> {
    return prisma.workspace.create({
      data: {
        type: 'SUBJECT',
        name,
        ownerId: userId,
        timezone,
        subjectId,
        members: {
          create: {
            userId,
            role: 'OWNER',
            status: 'ACCEPTED',
            joinedAt: new Date()
          }
        }
      },
      include: contextInclude
    });
  }

  async createProject(
    userId: string,
    name: string,
    timezone: string,
    input: NonNullable<CreateWorkspaceInput['project']>
  ): Promise<ContextRecord> {
    return prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          userId,
          name,
          description: input.description ?? null,
          semesterId: input.semesterId ?? null,
          subjectId: input.subjectId ?? null,
          status: input.status ?? 'ACTIVE',
          startDate: input.startDate ? new Date(`${input.startDate}T00:00:00.000Z`) : null,
          dueDate: input.dueDate ? new Date(`${input.dueDate}T00:00:00.000Z`) : null,
          members: {
            create: {
              userId,
              role: 'OWNER',
              status: 'ACCEPTED'
            }
          }
        }
      });

      return tx.workspace.create({
        data: {
          type: 'PROJECT',
          name,
          ownerId: userId,
          timezone,
          projectId: project.id,
          members: {
            create: {
              userId,
              role: 'OWNER',
              status: 'ACCEPTED',
              joinedAt: new Date()
            }
          }
        },
        include: contextInclude
      });
    });
  }

  async addMember(
    workspaceId: string,
    actorId: string,
    email: string,
    role: WorkspaceRole
  ): Promise<WorkspaceMemberRecord> {
    const targetUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim(), status: 'ACTIVE', deletedAt: null },
      select: { id: true }
    });
    if (!targetUser) {
      throw new NotFoundError('Không tìm thấy tài khoản người dùng với email này');
    }

    const existing = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUser.id
        }
      },
      select: memberSelect
    });

    if (existing && existing.status === 'ACCEPTED') {
      throw new ConflictError('Người dùng này đã là thành viên của Không gian làm việc');
    }

    if (existing) {
      return prisma.workspaceMember.update({
        where: { id: existing.id },
        data: {
          role,
          status: 'PENDING',
          invitedById: actorId,
          invitedAt: new Date()
        },
        select: memberSelect
      });
    }

    return prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: targetUser.id,
        invitedById: actorId,
        role,
        status: 'PENDING'
      },
      select: memberSelect
    });
  }

  async listInvitations(userId: string): Promise<any[]> {
    return prisma.workspaceMember.findMany({
      where: {
        userId,
        status: 'PENDING',
        workspace: { deletedAt: null, status: 'ACTIVE' }
      },
      include: {
        workspace: {
          include: workspaceRelations
        },
        invitedBy: {
          select: { id: true, fullName: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async acceptInvitation(memberId: string, userId: string): Promise<string> {
    const membership = await prisma.workspaceMember.findFirst({
      where: { id: memberId, userId, status: 'PENDING' },
      include: { workspace: true }
    });
    if (!membership) {
      throw new NotFoundError('Không tìm thấy lời mời tham gia hoặc lời mời đã được xử lý');
    }
    await prisma.workspaceMember.update({
      where: { id: memberId },
      data: {
        status: 'ACCEPTED',
        joinedAt: new Date()
      }
    });
    if (membership.workspace.projectId) {
      await prisma.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId: membership.workspace.projectId,
            userId
          }
        },
        create: {
          projectId: membership.workspace.projectId,
          userId,
          role: membership.role === 'MANAGER' ? 'ADMIN' : 'MEMBER',
          status: 'ACCEPTED'
        },
        update: {
          role: membership.role === 'MANAGER' ? 'ADMIN' : 'MEMBER',
          status: 'ACCEPTED'
        }
      });
    }
    return membership.workspaceId;
  }

  async declineInvitation(memberId: string, userId: string): Promise<void> {
    const membership = await prisma.workspaceMember.findFirst({
      where: { id: memberId, userId, status: 'PENDING' }
    });
    if (!membership) {
      throw new NotFoundError('Không tìm thấy lời mời tham gia hoặc lời mời đã được xử lý');
    }
    await prisma.workspaceMember.update({
      where: { id: memberId },
      data: {
        status: 'DECLINED'
      }
    });
  }

  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    newRole: WorkspaceRole
  ): Promise<WorkspaceMemberRecord> {
    const member = await prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
      include: { workspace: true }
    });
    if (!member) {
      throw new NotFoundError('Không tìm thấy thành viên trong Không gian làm việc');
    }
    if (member.workspace?.projectId) {
      await prisma.projectMember.updateMany({
        where: {
          projectId: member.workspace.projectId,
          userId: member.userId
        },
        data: {
          role: newRole === 'MANAGER' ? 'ADMIN' : (newRole === 'OWNER' ? 'OWNER' : 'MEMBER')
        }
      });
    }
    return prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: newRole },
      select: memberSelect
    });
  }

  async removeMember(
    workspaceId: string,
    memberId: string
  ): Promise<void> {
    const member = await prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
      include: { workspace: true }
    });
    if (!member) {
      throw new NotFoundError('Không tìm thấy thành viên trong Không gian làm việc');
    }
    if (member.role === 'OWNER') {
      throw new ConflictError('Không thể xóa Trưởng nhóm (Owner) khỏi Không gian làm việc');
    }
    await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { status: 'REMOVED' }
    });
    if (member.workspace?.projectId) {
      await prisma.projectMember.deleteMany({
        where: {
          projectId: member.workspace.projectId,
          userId: member.userId
        }
      });
    }
  }

  async getWorkspaceProgress(workspaceId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        type: true,
        ownerId: true,
        subjectId: true,
        projectId: true,
        members: {
          where: { status: 'ACCEPTED' },
          select: {
            id: true,
            userId: true,
            role: true,
            user: { select: { id: true, fullName: true, email: true } }
          }
        }
      }
    });
    if (!workspace) {
      throw new NotFoundError('Không tìm thấy Không gian làm việc');
    }

    const taskScope = workspace.type === 'GROUP'
      ? { workspaceId }
      : workspace.type === 'PROJECT' && workspace.projectId
        ? { projectId: workspace.projectId }
        : workspace.type === 'PERSONAL'
          ? { OR: [{ userId: workspace.ownerId }, { assignees: { some: { userId: workspace.ownerId } } }] }
          : workspace.type === 'SUBJECT' && workspace.subjectId
            ? { subjectId: workspace.subjectId }
            : null;
    const tasks = taskScope
      ? await prisma.task.findMany({
          where: { ...taskScope, deletedAt: null },
          select: {
            id: true,
            status: true,
            dueDate: true,
            assignees: { select: { userId: true } }
          }
        })
      : [];

    const now = new Date();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const todoTasks = tasks.filter((t) => t.status === 'TODO').length;
    const overdueTasks = tasks.filter((t) => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < now).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const memberProductivity = workspace.members.map((m) => {
      const assigned = tasks.filter((t) => t.assignees.some((a) => a.userId === m.userId));
      const assignedCount = assigned.length;
      const memberDone = assigned.filter((t) => t.status === 'DONE').length;
      const memberInProgress = assigned.filter((t) => t.status === 'IN_PROGRESS').length;
      const productivityPercent = assignedCount > 0 ? Math.round((memberDone / assignedCount) * 100) : 0;
      return {
        memberId: m.id,
        userId: m.userId,
        fullName: m.user.fullName,
        email: m.user.email,
        role: m.role,
        assignedCount,
        completedCount: memberDone,
        inProgressCount: memberInProgress,
        productivityPercent
      };
    });

    return {
      workspaceId,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overdueTasks,
      completionRate,
      membersCount: workspace.members.length,
      memberProductivity
    };
  }

  async joinWorkspace(userId: string, codeOrId: string): Promise<string> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(codeOrId);
    const workspace = await prisma.workspace.findFirst({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        OR: [
          ...(isUuid ? [{ id: codeOrId }] : []),
          { subject: { code: { equals: codeOrId, mode: 'insensitive' } } },
          { name: { equals: codeOrId, mode: 'insensitive' } }
        ]
      }
    });

    if (!workspace) {
      throw new NotFoundError('Không tìm thấy Không gian làm việc với mã hoặc ID này');
    }
    if (workspace.type === 'GROUP') throw new ConflictError('Hãy tham gia lớp học để vào nhóm');

    const existing = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId
        }
      }
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        if (workspace.projectId) {
          await prisma.projectMember.upsert({
            where: {
              projectId_userId: {
                projectId: workspace.projectId,
                userId
              }
            },
            create: {
              projectId: workspace.projectId,
              userId,
              role: 'MEMBER',
              status: 'ACCEPTED'
            },
            update: {
              status: 'ACCEPTED'
            }
          });
        }
        return workspace.id;
      }
      await prisma.workspaceMember.update({
        where: { id: existing.id },
        data: {
          status: 'ACCEPTED',
          joinedAt: new Date()
        }
      });
      if (workspace.projectId) {
        await prisma.projectMember.upsert({
          where: {
            projectId_userId: {
              projectId: workspace.projectId,
              userId
            }
          },
          create: {
            projectId: workspace.projectId,
            userId,
            role: 'MEMBER',
            status: 'ACCEPTED'
          },
          update: {
            status: 'ACCEPTED'
          }
        });
      }
      return workspace.id;
    }

    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId,
        role: 'MEMBER',
        status: 'ACCEPTED',
        joinedAt: new Date()
      }
    });
    if (workspace.projectId) {
      await prisma.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId: workspace.projectId,
            userId
          }
        },
        create: {
          projectId: workspace.projectId,
          userId,
          role: 'MEMBER',
          status: 'ACCEPTED'
        },
        update: {
          status: 'ACCEPTED'
        }
      });
    }
    return workspace.id;
  }
}
