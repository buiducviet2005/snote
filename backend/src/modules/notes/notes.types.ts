export type NoteType = 'LECTURE' | 'LAB_REPORT' | 'EXAM_PREP' | 'PROJECT_LOG' | 'MEETING_MINUTES' | 'GENERAL';

export interface NoteFilter {
  subjectId?: string;
  projectId?: string;
  noteType?: NoteType;
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

export interface INotesService {
  createNote(userId: string, dto: CreateNoteDto): Promise<any>;
  getNoteById(userId: string, noteId: string): Promise<any>;
  listNotes(userId: string, filter?: NoteFilter): Promise<any[]>;
  updateNote(userId: string, noteId: string, dto: UpdateNoteDto): Promise<any>;
  deleteNote(userId: string, noteId: string): Promise<void>;
}
