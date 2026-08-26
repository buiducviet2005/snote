export interface NoteFilter {
  subjectId?: string;
  projectId?: string;
  noteType?: 'LECTURE' | 'ASSIGNMENT' | 'EXAM_REVIEW' | 'RESOURCE' | 'IDEA';
  searchQuery?: string;
  tagIds?: string[];
  page?: number;
  limit?: number;
}

export interface CreateNoteDto {
  title: string;
  content: string;
  subjectId?: string;
  projectId?: string;
  noteType: 'LECTURE' | 'ASSIGNMENT' | 'EXAM_REVIEW' | 'RESOURCE' | 'IDEA';
  tagNames?: string[];
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  subjectId?: string;
  projectId?: string;
  noteType?: 'LECTURE' | 'ASSIGNMENT' | 'EXAM_REVIEW' | 'RESOURCE' | 'IDEA';
  tagNames?: string[];
}

export interface INotesService {
  createNote(userId: string, dto: CreateNoteDto): Promise<any>;
  getNoteById(userId: string, noteId: string): Promise<any>;
  listNotes(userId: string, filter: NoteFilter): Promise<{ data: any[]; total: number; page: number; limit: number }>;
  updateNote(userId: string, noteId: string, dto: UpdateNoteDto): Promise<any>;
  deleteNote(userId: string, noteId: string): Promise<void>;
}
