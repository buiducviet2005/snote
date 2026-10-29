import { Prisma } from '@prisma/client';
import { prisma } from '../db/prismaClient';
import { ForbiddenError } from '../errors/appErrors';

export async function writableProject(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      deletedAt: null,
      OR: [
        { userId },
        { members: { some: { userId, status: 'ACCEPTED', role: { in: ['OWNER', 'ADMIN', 'MEMBER'] } } } },
        { workspace: { ownerId: userId } },
        { workspace: { members: { some: { userId, status: 'ACCEPTED', role: { in: ['OWNER', 'MANAGER', 'MEMBER'] } } } } },
        { courseClass: { teacherId: userId, deletedAt: null } },
        { courseClass: { members: { some: { userId, role: 'CLASS_ADMIN' } }, deletedAt: null } }
      ]
    },
    include: {
      members: { where: { status: 'ACCEPTED' }, select: { userId: true } },
      workspace: {
        include: {
          members: { where: { status: 'ACCEPTED' }, select: { userId: true } }
        }
      }
    }
  });
  if (!project) throw new ForbiddenError('Bạn không có quyền thêm nội dung vào dự án này');
  return project;
}

export async function allowedSubject(subjectId: string, userId: string, projectSubjectId?: string | null) {
  if (subjectId === projectSubjectId) return;
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId, deletedAt: null } });
  if (!subject) throw new ForbiddenError('Môn học này không thuộc tài khoản của bạn');
}

export function allowedAssignees(
  ids: string[],
  userId: string,
  projectMembers?: Array<{ userId: string }>,
  workspaceMembers?: Array<{ userId: string }>,
  projectOwnerId?: string
) {
  const allowed = new Set<string>([userId]);
  if (projectOwnerId) allowed.add(projectOwnerId);
  if (projectMembers) {
    projectMembers.forEach((member) => allowed.add(member.userId));
  }
  if (workspaceMembers) {
    workspaceMembers.forEach((member) => allowed.add(member.userId));
  }
  if (ids.some((id) => !allowed.has(id))) {
    throw new ForbiddenError('Chỉ được giao việc cho thành viên dự án đã tham gia');
  }
}

export function visibleTasks(userId: string): Prisma.TaskWhereInput {
  return {
    OR: [
      { userId },
      { assignees: { some: { userId } } },
      { workspace: { type: 'GROUP', members: { some: { userId, status: 'ACCEPTED' } } } },
      { project: { userId } },
      { project: { members: { some: { userId, status: 'ACCEPTED' } } } },
      { project: { workspace: { ownerId: userId } } },
      { project: { workspace: { members: { some: { userId, status: 'ACCEPTED' } } } } },
      { project: { courseClass: { teacherId: userId, deletedAt: null } } },
      { project: { courseClass: { members: { some: { userId, role: 'CLASS_ADMIN' } }, deletedAt: null } } }
    ],
    AND: [{ OR: [
      { projectId: null },
      { project: { classId: null } },
      { project: { classId: { not: null }, OR: [
        { userId },
        { members: { some: { userId, status: 'ACCEPTED' } } },
        { workspace: { members: { some: { userId, status: 'ACCEPTED' } } } },
        { courseClass: { teacherId: userId, deletedAt: null } },
        { courseClass: { members: { some: { userId, role: 'CLASS_ADMIN' } }, deletedAt: null } }
      ] } }
    ] }, { OR: [
      { workspaceId: null },
      { workspace: { type: { not: 'GROUP' } } },
      { workspace: { type: 'GROUP', members: { some: { userId, status: 'ACCEPTED' } } } }
    ] }]
  };
}
