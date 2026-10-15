import type { Prisma } from '@prisma/client';

export interface ClassroomRoleContext {
  isTeacher: boolean;
  classRole?: 'CLASS_ADMIN' | 'STUDENT';
  isLeader?: boolean;
  isGroupMember?: boolean;
}

export function classroomPermissions(context: ClassroomRoleContext) {
  const manageClass = context.isTeacher || context.classRole === 'CLASS_ADMIN';
  return {
    manageClass,
    manageGroup: manageClass || Boolean(context.isLeader),
    manageProject: manageClass || Boolean(context.isLeader),
    viewGroupProject: manageClass || Boolean(context.isGroupMember),
    submitReport: Boolean(context.isGroupMember),
    reviewReport: context.isTeacher
  };
}

export function classroomProjectWhere(classId: string, userId: string, isManager: boolean): Prisma.ProjectWhereInput {
  return {
    classId,
    deletedAt: null,
    groupId: { not: null },
    ...(!isManager ? { studyGroup: { members: { some: { userId } } } } : {})
  };
}
