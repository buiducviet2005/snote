import { Request, Response } from 'express';
import { ScheduleService } from './schedule.service';
import { createScheduleEventSchema, updateScheduleEventSchema } from './schedule.schemas';

export class ScheduleController {
  constructor(private readonly service: ScheduleService = new ScheduleService()) {}

  getEvents = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { startDate, endDate, semesterId, subjectId } = req.query;
    const data = await this.service.getEvents(
      userId,
      startDate as string | undefined,
      endDate as string | undefined,
      semesterId as string | undefined,
      subjectId as string | undefined
    );
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách sự kiện lịch thành công',
      data
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const data = await this.service.getEventById(id, userId);
    res.status(200).json({
      success: true,
      data
    });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const validated = createScheduleEventSchema.parse(req.body);
    const data = await this.service.createEvent(userId, validated);
    res.status(201).json({
      success: true,
      message: 'Tạo sự kiện lịch mới thành công',
      data
    });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const validated = updateScheduleEventSchema.parse(req.body);
    const data = await this.service.updateEvent(id, userId, validated);
    res.status(200).json({
      success: true,
      message: 'Cập nhật sự kiện lịch thành công',
      data
    });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    await this.service.deleteEvent(id, userId);
    res.status(200).json({
      success: true,
      message: 'Xóa sự kiện lịch thành công'
    });
  };
}
