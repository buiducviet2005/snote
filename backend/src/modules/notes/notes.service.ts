import { INotesService, CreateNoteDto, UpdateNoteDto, NoteFilter } from './notes.types';
import { NotesRepository } from './notes.repository';
import { NotFoundError } from '../../shared/errors/appErrors';

export class NotesService implements INotesService {
  private repository: NotesRepository;

  constructor() {
    this.repository = new NotesRepository();
  }

  async listNotes(userId: string, filter?: NoteFilter): Promise<any[]> {
    return this.repository.findMany(userId, filter);
  }

  async getNoteById(userId: string, id: string): Promise<any> {
    const note = await this.repository.findById(userId, id);
    if (!note) {
      throw new NotFoundError(`Không tìm thấy ghi chú với ID: ${id}`, { id, userId });
    }
    return note;
  }

  async createNote(userId: string, dto: CreateNoteDto): Promise<any> {
    return this.repository.create(userId, dto);
  }

  async updateNote(userId: string, id: string, dto: UpdateNoteDto): Promise<any> {
    const existing = await this.repository.findById(userId, id);
    if (!existing) {
      throw new NotFoundError(`Không tìm thấy ghi chú để cập nhật: ${id}`, { id, userId });
    }
    return this.repository.update(userId, id, dto);
  }

  async deleteNote(userId: string, id: string): Promise<void> {
    const existing = await this.repository.findById(userId, id);
    if (!existing) {
      throw new NotFoundError(`Không tìm thấy ghi chú để xóa: ${id}`, { id, userId });
    }
    return this.repository.softDelete(userId, id);
  }
}
