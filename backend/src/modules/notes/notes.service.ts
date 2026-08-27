import { NotesRepository } from './notes.repository';
import { CreateNoteDto, UpdateNoteDto, NoteFilter, NoteResponseDto } from './notes.types';
import { NotFoundError } from '../../shared/errors/appErrors';

export class NotesService {
  constructor(private readonly repository: NotesRepository = new NotesRepository()) {}

  private mapDto(note: any): NoteResponseDto {
    return {
      id: note.id,
      userId: note.userId,
      subjectId: note.subjectId,
      projectId: note.projectId,
      title: note.title,
      content: note.content,
      noteType: note.noteType,
      isPinned: note.isPinned,
      isArchived: note.isArchived,
      tags: (note.noteTags || []).map((nt: any) => ({
        id: nt.tag.id,
        name: nt.tag.name,
        color: nt.tag.color
      })),
      subject: note.subject,
      project: note.project,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    };
  }

  async getNotes(userId: string, filter?: NoteFilter): Promise<{ notes: NoteResponseDto[]; total: number }> {
    const { notes, total } = await this.repository.findMany(userId, filter);
    return {
      notes: notes.map((n) => this.mapDto(n)),
      total
    };
  }

  async getNoteById(id: string, userId: string): Promise<NoteResponseDto> {
    const note = await this.repository.findById(id, userId);
    if (!note) {
      throw new NotFoundError('Không tìm thấy ghi chú yêu cầu');
    }
    return this.mapDto(note);
  }

  async createNote(userId: string, dto: CreateNoteDto): Promise<NoteResponseDto> {
    const note = await this.repository.create(userId, dto);
    return this.mapDto(note);
  }

  async updateNote(id: string, userId: string, dto: UpdateNoteDto): Promise<NoteResponseDto> {
    await this.getNoteById(id, userId);
    const updated = await this.repository.update(id, userId, dto);
    return this.mapDto(updated);
  }

  async deleteNote(id: string, userId: string): Promise<void> {
    await this.getNoteById(id, userId);
    await this.repository.softDelete(id, userId);
  }

  async togglePin(id: string, userId: string): Promise<NoteResponseDto> {
    const note = await this.getNoteById(id, userId);
    const updated = await this.repository.update(id, userId, { isPinned: !note.isPinned });
    return this.mapDto(updated);
  }

  async toggleArchive(id: string, userId: string): Promise<NoteResponseDto> {
    const note = await this.getNoteById(id, userId);
    const updated = await this.repository.update(id, userId, { isArchived: !note.isArchived });
    return this.mapDto(updated);
  }
}
