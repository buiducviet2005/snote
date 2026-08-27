import { Request, Response } from 'express';
import { SubjectsService } from './subjects.service';
import { createSubjectSchema, updateSubjectSchema } from './subjects.schemas';

export class SubjectsController {
  constructor(private readonly service: SubjectsService = new SubjectsService()) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const semesterId = req.query.semesterId as string | undefined;
    const data = await this.service.getAllSubjects(userId, semesterId);
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách môn học thành công',
      data
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const data = await this.service.getSubjectById(id, userId);
    res.status(200).json({
      success: true,
      data
    });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const validated = createSubjectSchema.parse(req.body);
    const data = await this.service.createSubject(userId, validated);
    res.status(201).json({
      success: true,
      message: 'Tạo môn học mới thành công',
      data
    });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const validated = updateSubjectSchema.parse(req.body);
    const data = await this.service.updateSubject(id, userId, validated);
    res.status(200).json({
      success: true,
      message: 'Cập nhật môn học thành công',
      data
    });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    await this.service.deleteSubject(id, userId);
    res.status(200).json({
      success: true,
      message: 'Xóa môn học thành công'
    });
  };
}
