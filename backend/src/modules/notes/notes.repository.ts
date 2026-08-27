import { CreateNoteDto, NoteFilter, UpdateNoteDto } from './notes.types';

export class NotesRepository {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findMany(userId: string, filter?: NoteFilter): Promise<any[]> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findById(userId: string, noteId: string): Promise<any | null> {
    return null;
  }

  async create(userId: string, dto: CreateNoteDto): Promise<any> {
    return {
      id: 'stub-uuid',
      userId,
      ...dto,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async update(userId: string, noteId: string, dto: UpdateNoteDto): Promise<any> {
    return {
      id: noteId,
      userId,
      ...dto,
      updatedAt: new Date().toISOString()
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async softDelete(userId: string, noteId: string): Promise<void> {
    // Sẽ kết nối Prisma ở Bước 4
  }
}
