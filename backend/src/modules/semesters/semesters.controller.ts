import { Request, Response } from 'express';
import { SemestersService } from './semesters.service';
import { createSemesterSchema, updateSemesterSchema } from './semesters.schemas';

export class SemestersController {
  constructor(private readonly service: SemestersService = new SemestersService()) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const data = await this.service.getAllSemesters(userId);
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách học kỳ thành công',
      data
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const data = await this.service.getSemesterById(id, userId);
    res.status(200).json({
      success: true,
      data
    });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const validated = createSemesterSchema.parse(req.body);
    const data = await this.service.createSemester(userId, validated);
    res.status(201).json({
      success: true,
      message: 'Tạo học kỳ mới thành công',
      data
    });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const validated = updateSemesterSchema.parse(req.body);
    const data = await this.service.updateSemester(id, userId, validated);
    res.status(200).json({
      success: true,
      message: 'Cập nhật học kỳ thành công',
      data
    });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    await this.service.deleteSemester(id, userId);
    res.status(200).json({
      success: true,
      message: 'Xóa học kỳ thành công'
    });
  };
}
