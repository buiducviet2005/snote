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
        { courseClass: { teacherId: userId, deletedAt: null } },
        { courseClass: { members: { some: { userId, role: 'CLASS_ADMIN' } }, deletedAt: null } }
      ]
    },
    include: { members: { where: { status: 'ACCEPTED' }, select: { userId: true } } }
  });
  if (!project) throw new ForbiddenError('Bạn không có quyền thêm nội dung vào dự án này');
  return project;
}

export async function allowedSubject(subjectId: string, userId: string, projectSubjectId?: string | null) {
  if (subjectId === projectSubjectId) return;
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId, deletedAt: null } });
  if (!subject) throw new ForbiddenError('Môn học này không thuộc tài khoản của bạn');
}

export function allowedAssignees(ids: string[], userId: string, projectMembers?: Array<{ userId: string }>) {
  const allowed = projectMembers ? new Set(projectMembers.map((member) => member.userId)) : new Set([userId]);
  if (ids.some((id) => !allowed.has(id))) {
    throw new ForbiddenError('Chỉ được giao việc cho thành viên dự án đã tham gia');
  }
}

export function visibleTasks(userId: string): Prisma.TaskWhereInput {
  return {
    OR: [
      { userId },
      { assignees: { some: { userId } } },
      { project: { userId } },
      { project: { members: { some: { userId, status: 'ACCEPTED' } } } },
      { project: { courseClass: { teacherId: userId, deletedAt: null } } },
      { project: { courseClass: { members: { some: { userId, role: 'CLASS_ADMIN' } }, deletedAt: null } } }
    ],
    AND: [{ OR: [
      { projectId: null },
      { project: { classId: null } },
      { project: { classId: { not: null }, OR: [
        { userId },
        { members: { some: { userId, status: 'ACCEPTED' } } },
        { courseClass: { teacherId: userId, deletedAt: null } },
        { courseClass: { members: { some: { userId, role: 'CLASS_ADMIN' } }, deletedAt: null } }
      ] } }
    ] }]
  };
}
