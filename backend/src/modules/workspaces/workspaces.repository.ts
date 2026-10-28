import type { Prisma } from '@prisma/client';
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
          dueDate: input.dueDate ? new Date(`${input.dueDate}T00:00:00.000Z`) : null
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
}
