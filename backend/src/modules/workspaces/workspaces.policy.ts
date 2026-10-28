import type { WorkspaceRole, WorkspaceStatus, WorkspaceType } from '@prisma/client';

export const workspaceLimits = {
  maxUploadBytes: 10 * 1024 * 1024,
  allowedMediaTypes: ['text/plain', 'text/markdown', 'application/pdf', 'image/png', 'image/jpeg'],
  maxGanttDays: 366,
  maxGanttTasks: 500,
  maxGanttEdges: 1000,
  maxGanttMilestones: 200
} as const;

export function workspacePermissions(
  role: WorkspaceRole,
  status: WorkspaceStatus,
  type: WorkspaceType = 'PERSONAL'
): string[] {
  const readOnly = ['workspace.read', 'member.read'];
  if (status === 'ARCHIVED') {
    return role === 'OWNER' ? [...readOnly, 'workspace.reopen'] : readOnly;
  }

  const management = [
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

  if (role === 'OWNER') {
    return [...management, 'workspace.archive', 'workspace.reopen'];
  }

  if (role === 'MANAGER') {
    return management;
  }

  if (role === 'VIEWER') {
    return [...readOnly, 'document.download'];
  }

  // ROLE === 'MEMBER' -> STRICT DIFFERENTIATION BETWEEN CLASS (SUBJECT) AND PROJECT
  if (type === 'SUBJECT') {
    // IN CLASSROOM: Student member reads announcements, downloads syllabus, takes lecture notes, and submits reports.
    // Cannot assign class tasks or alter course milestones.
    return [
      ...readOnly,
      'document.download',
      'note.create',
      'note.update',
      'note.delete',
      'task.submit',
      'view.create.personal',
      'progress.read.self'
    ];
  }

  // IN PROJECT OR PERSONAL: Team members collaborate actively (create task, update status, upload docs)
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
}

export function workspaceCapabilities(role: WorkspaceRole, type: WorkspaceType = 'PERSONAL') {
  const manager = role === 'OWNER' || role === 'MANAGER';
  return {
    notes: true,
    tasks: true,
    documents: true,
    members: true,
    reviews: manager,
    // Gantt timeline: in SUBJECT, only instructors manage syllabus deadlines; in PROJECT/PERSONAL, everyone uses the WBS Gantt
    gantt: type !== 'SUBJECT' || manager,
    chat: false
  };
}

export function canPerformWorkspaceAction(
  role: WorkspaceRole,
  status: WorkspaceStatus,
  action: string,
  type: WorkspaceType = 'PERSONAL'
): boolean {
  return workspacePermissions(role, status, type).includes(action);
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
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}
