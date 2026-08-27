import { prisma } from '../../shared/db/prismaClient';
import { Note } from '@prisma/client';
import { CreateNoteDto, UpdateNoteDto, NoteFilter } from './notes.types';

export class NotesRepository {
  async findMany(userId: string, filter?: NoteFilter): Promise<{ notes: any[]; total: number }> {
    const page = filter?.page || 1;
    const limit = filter?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      deletedAt: null,
      subjectId: filter?.subjectId || undefined,
      projectId: filter?.projectId || undefined,
      noteType: filter?.noteType || undefined,
      isPinned: filter?.isPinned !== undefined ? filter.isPinned : undefined,
      isArchived: filter?.isArchived !== undefined ? filter.isArchived : undefined
    };

    if (filter?.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { content: { contains: filter.search, mode: 'insensitive' } }
      ];
    }

    const [total, notes] = await Promise.all([
      prisma.note.count({ where }),
      prisma.note.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        include: {
          noteTags: {
            include: { tag: true }
          }
        }
      })
    ]);

    return { notes, total };
  }

  async findById(id: string, userId: string): Promise<any | null> {
    return prisma.note.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        noteTags: {
          include: { tag: true }
        }
      }
    });
  }

  private async getOrCreateTags(userId: string, tagNames: string[]): Promise<string[]> {
    const tagIds: string[] = [];
    for (const name of tagNames) {
      const cleanName = name.trim();
      if (!cleanName) continue;
      const tag = await prisma.tag.upsert({
        where: { userId_name: { userId, name: cleanName } },
        update: {},
        create: { userId, name: cleanName }
      });
      tagIds.push(tag.id);
    }
    return tagIds;
  }

  async create(userId: string, data: CreateNoteDto): Promise<any> {
    let tagIds: string[] = [];
    if (data.tagNames && data.tagNames.length > 0) {
      tagIds = await this.getOrCreateTags(userId, data.tagNames);
    }

    return prisma.note.create({
      data: {
        userId,
        title: data.title,
        content: data.content,
        subjectId: data.subjectId || null,
        projectId: data.projectId || null,
        noteType: data.noteType || 'LECTURE',
        isPinned: data.isPinned ?? false,
        noteTags: {
          create: tagIds.map((tagId) => ({ tagId }))
        }
      },
      include: {
        noteTags: {
          include: { tag: true }
        }
      }
    });
  }

  async update(id: string, userId: string, data: UpdateNoteDto): Promise<any> {
    let noteTagsUpdate: any = undefined;

    if (data.tagNames !== undefined) {
      const tagIds = await this.getOrCreateTags(userId, data.tagNames);
      noteTagsUpdate = {
        deleteMany: {},
        create: tagIds.map((tagId) => ({ tagId }))
      };
    }

    return prisma.note.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        subjectId: data.subjectId !== undefined ? (data.subjectId || null) : undefined,
        projectId: data.projectId !== undefined ? (data.projectId || null) : undefined,
        noteType: data.noteType,
        isPinned: data.isPinned,
        isArchived: data.isArchived,
        noteTags: noteTagsUpdate
      },
      include: {
        noteTags: {
          include: { tag: true }
        }
      }
    });
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await prisma.note.updateMany({
      where: { id, userId },
      data: { deletedAt: new Date() }
    });
  }
}
