import type { WorkspaceRole, WorkspaceStatus } from '@prisma/client';

export const workspaceLimits = {
  maxUploadBytes: 10 * 1024 * 1024,
  allowedMediaTypes: ['text/plain', 'text/markdown', 'application/pdf', 'image/png', 'image/jpeg'],
  maxGanttDays: 366,
  maxGanttTasks: 500,
  maxGanttEdges: 1000,
  maxGanttMilestones: 200
} as const;

export function workspacePermissions(role: WorkspaceRole, status: WorkspaceStatus): string[] {
  const readOnly = ['workspace.read', 'member.read'];
  if (status === 'ARCHIVED') {
    return role === 'OWNER' ? [...readOnly, 'workspace.reopen'] : readOnly;
  }

  switch (role) {
    case 'OWNER':
      return [
        ...readOnly,
        'workspace.update',
        'workspace.archive',
        'workspace.reopen',
        'member.invite',
        'member.manage',
        'role.assign',
        'note.create',
        'note.update',
        'note.delete',
        'document.upload',
        'document.update',
        'document.delete',
        'document.download',
        'task.create',
        'task.update.assigned',
        'task.update.any',
        'task.assign',
        'task.submit',
        'task.review',
        'dependency.manage',
        'milestone.manage',
        'view.create.personal',
        'view.manage.shared',
        'progress.read.self',
        'progress.read.workspace',
        'progress.read.member'
      ];
    case 'MANAGER':
      return [
        ...readOnly,
        'workspace.update',
        'member.invite',
        'member.manage',
        'role.assign',
        'note.create',
        'note.update',
        'note.delete',
        'document.upload',
        'document.update',
        'document.delete',
        'document.download',
        'task.create',
        'task.update.assigned',
        'task.update.any',
        'task.assign',
        'task.submit',
        'task.review',
        'dependency.manage',
        'milestone.manage',
        'view.create.personal',
        'view.manage.shared',
        'progress.read.self',
        'progress.read.workspace',
        'progress.read.member'
      ];
    case 'MEMBER':
      return [
        ...readOnly,
        'note.create',
        'note.update',
        'note.delete',
        'document.upload',
        'document.download',
        'task.create',
        'task.update.assigned',
        'task.submit',
        'view.create.personal',
        'progress.read.self'
      ];
    case 'VIEWER':
      return readOnly;
  }
}

export function workspaceCapabilities(role: WorkspaceRole) {
  const manager = role === 'OWNER' || role === 'MANAGER';
  return {
    notes: true,
    tasks: true,
    documents: true,
    members: true,
    reviews: manager,
    gantt: true,
    chat: false
  };
}

export function canPerformWorkspaceAction(
  role: WorkspaceRole,
  status: WorkspaceStatus,
  action: string
): boolean {
  return workspacePermissions(role, status).includes(action);
}

export function workspaceMemberAccessWhere(workspaceId: string, userId: string) {
  return {
    id: workspaceId,
    deletedAt: null,
    members: {
      some: {
        userId,
        status: 'ACCEPTED' as const,
        user: {
          status: 'ACTIVE' as const,
          deletedAt: null
        }
      }
    }
  };
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}
