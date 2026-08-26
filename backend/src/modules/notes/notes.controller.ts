import { Request, Response, NextFunction } from 'express';
import { NotesService } from './notes.service';
import { createNoteSchema } from './notes.schemas';

export class NotesController {
  private notesService: NotesService;

  constructor() {
    this.notesService = new NotesService();
  }

  listNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id || 'demo-user-uuid';
      const result = await this.notesService.listNotes(userId, req.query as any);
      res.status(200).json({
        success: true,
        message: 'Lấy danh sách ghi chú thành công (stub)',
        data: result.data,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit
        }
      });
    } catch (error) {
      next(error);
    }
  };

  createNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id || 'demo-user-uuid';
      const validatedData = createNoteSchema.parse(req.body);
      const note = await this.notesService.createNote(userId, validatedData);
      res.status(201).json({
        success: true,
        message: 'Tạo ghi chú thành công (stub)',
        data: note
      });
    } catch (error) {
      next(error);
    }
  };
}
