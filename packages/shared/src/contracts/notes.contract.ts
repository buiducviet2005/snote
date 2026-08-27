import { NoteType } from '../enums';

export interface CreateNoteDto {
  title: string;
  content: string;
  subjectId?: string;
  projectId?: string;
  noteType: NoteType;
  tagNames?: string[];
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  subjectId?: string;
  projectId?: string;
  noteType?: NoteType;
  tagNames?: string[];
}

export interface NoteResponseDto {
  id: string;
  userId: string;
  title: string;
  content: string;
  subjectId?: string | null;
  projectId?: string | null;
  noteType: NoteType;
  tagNames?: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
}
