export type WorkspaceType = 'PERSONAL' | 'SUBJECT' | 'PROJECT';
export type WorkspaceStatus = 'ACTIVE' | 'ARCHIVED';
export type WorkspaceRole = 'OWNER' | 'MANAGER' | 'MEMBER' | 'VIEWER';

export interface WorkspaceSummary {
  id: string;
  type: WorkspaceType;
  name: string;
  code?: string;
  description?: string;
  status: WorkspaceStatus;
  role: WorkspaceRole;
  icon?: string;
  color?: string;
  memberCount?: number;
  subjectCode?: string;
}

export interface WorkspaceContextData {
  workspace: WorkspaceSummary;
  currentRole: WorkspaceRole;
  isOwner: boolean;
  canEdit: boolean;
  canManageMembers: boolean;
  isArchived: boolean;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  workspace: WorkspaceSummary;
  role: WorkspaceRole;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REMOVED';
  invitedAt: string;
  invitedBy?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
}

export interface NavItemDef {
  id: string;
  label: string;
  iconName: string;
  badge?: string | number;
  viewType?: string;
  isExternal?: boolean;
}
