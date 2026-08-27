import { NoteType } from '@prisma/client';

export interface CreateNoteDto {
  title: string;
  content: string;
  subjectId?: string;
  projectId?: string;
  noteType?: NoteType;
  tagNames?: string[];
  isPinned?: boolean;
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  subjectId?: string;
  projectId?: string;
  noteType?: NoteType;
  tagNames?: string[];
  isPinned?: boolean;
  isArchived?: boolean;
}

export interface NoteFilter {
  subjectId?: string;
  projectId?: string;
  noteType?: NoteType;
  isPinned?: boolean;
  isArchived?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TagDto {
  id: string;
  name: string;
  color: string | null;
}

export interface NoteResponseDto {
  id: string;
  userId: string;
  subjectId: string | null;
  projectId: string | null;
  title: string;
  content: string;
  noteType: NoteType;
  isPinned: boolean;
  isArchived: boolean;
  tags: TagDto[];
  createdAt: Date;
  updatedAt: Date;
}
