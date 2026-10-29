import { prisma } from '../db/prismaClient';
import { NotFoundError, ValidationError } from '../errors/appErrors';

export async function resolveWorkspaceScope(workspaceId: string, userId: string) {
  if (typeof workspaceId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(workspaceId)) {
    throw new ValidationError('ID không gian không hợp lệ');
  }
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      deletedAt: null,
      members: { some: { userId, status: 'ACCEPTED' } }
    },
    select: { id: true, type: true, status: true, ownerId: true, subjectId: true, projectId: true, groupId: true,
      members: { where: { status: 'ACCEPTED' }, select: { userId: true, role: true } } }
  });
  if (!workspace) throw new NotFoundError('Không tìm thấy không gian hoặc bạn chưa là thành viên');
  return workspace;
}
