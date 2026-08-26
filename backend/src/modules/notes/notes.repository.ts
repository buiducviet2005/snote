import { prisma } from '../../shared/db/prismaClient';

export class NotesRepository {
  async findMany(userId: string) {
    // Sẽ kết nối trực tiếp với Prisma Client sau khi generate schema ở Bước 4
    return [];
  }

  async findById(userId: string, noteId: string) {
    return null;
  }
}
