import { Request, Response } from 'express';
import { TasksService } from './tasks.service';
import { createTaskSchema, updateTaskSchema } from './tasks.schemas';

export class TasksController {
  constructor(private readonly tasksService: TasksService = new TasksService()) {}

  getTasks = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { subjectId, projectId, status, priority, search, page, limit } = req.query;

    const filter = {
      subjectId: subjectId as string,
      projectId: projectId as string,
      status: status as any,
      priority: priority as any,
      search: search as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 50
    };

    const { tasks, total } = await this.tasksService.getTasks(userId, filter);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách công việc thành công',
      data: tasks,
      meta: {
        total,
        page: filter.page,
        limit: filter.limit
      }
    });
  };

  getTaskById = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const task = await this.tasksService.getTaskById(id, userId);
    res.status(200).json({
      success: true,
      data: task
    });
  };

  createTask = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const validatedData = createTaskSchema.parse(req.body);
    const newTask = await this.tasksService.createTask(userId, validatedData);

    res.status(201).json({
      success: true,
      message: 'Tạo công việc mới thành công',
      data: newTask
    });
  };

  updateTask = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const validatedData = updateTaskSchema.parse(req.body);
    const updated = await this.tasksService.updateTask(id, userId, validatedData);

    res.status(200).json({
      success: true,
      message: 'Cập nhật công việc thành công',
      data: updated
    });
  };

  deleteTask = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    await this.tasksService.deleteTask(id, userId);

    res.status(200).json({
      success: true,
      message: 'Xóa công việc thành công'
    });
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { status } = req.body;
    const updated = await this.tasksService.updateStatus(id, userId, status);

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái công việc thành công',
      data: updated
    });
  };
}
