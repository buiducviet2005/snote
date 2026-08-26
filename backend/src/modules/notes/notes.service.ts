import { INotesService, CreateNoteDto, UpdateNoteDto, NoteFilter } from './notes.types';
import { NotesRepository } from './notes.repository';

export class NotesService implements INotesService {
  private notesRepo: NotesRepository;

  constructor() {
    this.notesRepo = new NotesRepository();
  }

  async createNote(userId: string, dto: CreateNoteDto): Promise<any> {
    return {
      id: 'stub-uuid',
      userId,
      ...dto,
      createdAt: new Date().toISOString()
    };
  }

  async getNoteById(userId: string, noteId: string): Promise<any> {
    return this.notesRepo.findById(userId, noteId);
  }

  async listNotes(userId: string, filter: NoteFilter): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const data = await this.notesRepo.findMany(userId);
    return {
      data,
      total: data.length,
      page: filter.page || 1,
      limit: filter.limit || 20
    };
  }

  async updateNote(userId: string, noteId: string, dto: UpdateNoteDto): Promise<any> {
    return { id: noteId, ...dto };
  }

  async deleteNote(userId: string, noteId: string): Promise<void> {
    // Soft delete logic
  }
}
