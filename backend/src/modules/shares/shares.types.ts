import { ShareTargetType, ShareAccessLevel } from '@prisma/client';

export interface CreateShareDto {
  targetType: ShareTargetType;
  targetId: string;
  sharedWithEmail?: string;
  accessLevel?: ShareAccessLevel;
  isPublic?: boolean;
  expiresInDays?: number;
}

export interface ShareResponseDto {
  id: string;
  ownerId: string;
  targetType: ShareTargetType;
  targetId: string;
  targetTitle?: string;
  sharedWithUserId: string | null;
  sharedWithEmail: string | null;
  accessLevel: ShareAccessLevel;
  shareToken: string | null;
  isPublic: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  owner?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  sharedWithUser?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  targetItem?: any;
}
