import { Request, Response } from 'express';
import { ProjectsService } from './projects.service';
import { createProjectSchema, updateProjectSchema } from './projects.schemas';

export class ProjectsController {
  constructor(private readonly service: ProjectsService = new ProjectsService()) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const semesterId = req.query.semesterId as string | undefined;
    const subjectId = req.query.subjectId as string | undefined;
    const data = await this.service.getAllProjects(userId, semesterId, subjectId);
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách đồ án thành công',
      data
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const data = await this.service.getProjectById(id, userId);
    res.status(200).json({
      success: true,
      data
    });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const validated = createProjectSchema.parse(req.body);
    const data = await this.service.createProject(userId, validated);
    res.status(201).json({
      success: true,
      message: 'Tạo đồ án mới thành công',
      data
    });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const validated = updateProjectSchema.parse(req.body);
    const data = await this.service.updateProject(id, userId, validated);
    res.status(200).json({
      success: true,
      message: 'Cập nhật đồ án thành công',
      data
    });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    await this.service.deleteProject(id, userId);
    res.status(200).json({
      success: true,
      message: 'Xóa đồ án thành công'
    });
  };

  addMember = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const data = await this.service.addMember(id, userId, req.body);
    res.status(200).json({
      success: true,
      message: 'Thêm thành viên vào đồ án thành công',
      data
    });
  };

  removeMember = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const targetUserId = req.params.memberUserId as string;
    await this.service.removeMember(id, userId, targetUserId);
    res.status(200).json({
      success: true,
      message: 'Xóa thành viên khỏi đồ án thành công'
    });
  };
}
