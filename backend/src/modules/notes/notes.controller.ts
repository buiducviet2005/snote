import { Request, Response } from 'express';
import { NotesService } from './notes.service';
import { createNoteSchema, updateNoteSchema } from './notes.schemas';
import { ValidationError } from '../../shared/errors/appErrors';

export class NotesController {
  private notesService: NotesService;

  constructor() {
    this.notesService = new NotesService();
  }

  listNotes = async (req: Request, res: Response): Promise<void> => {
    // Chống IDOR: Lấy userId từ JWT req.user đã xác thực
    const userId = req.user?.id || 'demo-user-uuid';
    const filter = {
      subjectId: req.query.subjectId as string | undefined,
      projectId: req.query.projectId as string | undefined
    };

    const notes = await this.notesService.listNotes(userId, filter);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách ghi chú thành công',
      data: notes,
      meta: {
        total: notes.length,
        page: 1,
        limit: 20
      }
    });
  };

  createNote = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id || 'demo-user-uuid';
    const parseResult = createNoteSchema.safeParse(req.body);

    if (!parseResult.success) {
      throw new ValidationError(
        'Dữ liệu tạo ghi chú không hợp lệ: ' + parseResult.error.errors.map(e => e.message).join('; '),
        { zodErrors: parseResult.error.format() }
      );
    }

    const note = await this.notesService.createNote(userId, parseResult.data);

    res.status(201).json({
      success: true,
      message: 'Tạo ghi chú thành công',
      data: note
    });
  };

  getNoteById = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id || 'demo-user-uuid';
    const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const note = await this.notesService.getNoteById(userId, noteId);

    res.status(200).json({
      success: true,
      data: note
    });
  };

  updateNote = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id || 'demo-user-uuid';
    const noteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parseResult = updateNoteSchema.safeParse(req.body);

    if (!parseResult.success) {
      throw new ValidationError(
        'Dữ liệu cập nhật ghi chú không hợp lệ',
        { zodErrors: parseResult.error.format() }
      );
    }

    const note = await this.notesService.updateNote(userId, noteId, parseResult.data);

    res.status(200).json({
      success: true,
      message: 'Cập nhật ghi chú thành công',
      data: note
    });
  };
}
