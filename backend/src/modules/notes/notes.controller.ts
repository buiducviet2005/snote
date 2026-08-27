import { Request, Response } from 'express';
import { NotesService } from './notes.service';
import { createNoteSchema, updateNoteSchema } from './notes.schemas';

export class NotesController {
  constructor(private readonly notesService: NotesService = new NotesService()) {}

  getNotes = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { subjectId, projectId, noteType, isPinned, isArchived, search, page, limit } = req.query;

    const filter = {
      subjectId: subjectId as string,
      projectId: projectId as string,
      noteType: noteType as any,
      isPinned: isPinned !== undefined ? isPinned === 'true' : undefined,
      isArchived: isArchived !== undefined ? isArchived === 'true' : undefined,
      search: search as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20
    };

    const { notes, total } = await this.notesService.getNotes(userId, filter);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách ghi chú thành công',
      data: notes,
      meta: {
        total,
        page: filter.page,
        limit: filter.limit
      }
    });
  };

  getNoteById = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const note = await this.notesService.getNoteById(id, userId);
    res.status(200).json({
      success: true,
      data: note
    });
  };

  createNote = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const validatedData = createNoteSchema.parse(req.body);
    const newNote = await this.notesService.createNote(userId, validatedData);

    res.status(201).json({
      success: true,
      message: 'Tạo ghi chú mới thành công',
      data: newNote
    });
  };

  updateNote = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const validatedData = updateNoteSchema.parse(req.body);
    const updated = await this.notesService.updateNote(id, userId, validatedData);

    res.status(200).json({
      success: true,
      message: 'Cập nhật ghi chú thành công',
      data: updated
    });
  };

  deleteNote = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    await this.notesService.deleteNote(id, userId);

    res.status(200).json({
      success: true,
      message: 'Xóa ghi chú thành công'
    });
  };

  togglePin = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const note = await this.notesService.togglePin(id, userId);

    res.status(200).json({
      success: true,
      message: note.isPinned ? 'Đã ghim ghi chú' : 'Đã bỏ ghim ghi chú',
      data: note
    });
  };

  toggleArchive = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const note = await this.notesService.toggleArchive(id, userId);

    res.status(200).json({
      success: true,
      message: note.isArchived ? 'Đã lưu trữ ghi chú' : 'Đã khôi phục ghi chú',
      data: note
    });
  };
}
