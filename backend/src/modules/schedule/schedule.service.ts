import { ScheduleRepository } from './schedule.repository';
import {
  CreateScheduleEventDto,
  UpdateScheduleEventDto,
  ScheduleEventResponseDto,
  UnifiedScheduleItemDto
} from './schedule.types';
import { NotFoundError } from '../../shared/errors/appErrors';

export class ScheduleService {
  constructor(private readonly repo: ScheduleRepository = new ScheduleRepository()) {}

  private mapDto(event: any): ScheduleEventResponseDto {
    return {
      id: event.id,
      semesterId: event.semesterId,
      subjectId: event.subjectId,
      title: event.title,
      location: event.location,
      eventType: event.eventType,
      startTime: event.startTime,
      endTime: event.endTime,
      isRecurring: event.isRecurring,
      recurrenceRule: event.recurrenceRule,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    };
  }

  async getEvents(
    userId: string,
    startDate?: string,
    endDate?: string,
    semesterId?: string,
    subjectId?: string
  ): Promise<UnifiedScheduleItemDto[]> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.repo.findUnifiedSchedule(userId, start, end, semesterId, subjectId);
  }

  async getEventById(id: string, userId: string): Promise<ScheduleEventResponseDto> {
    const event = await this.repo.findByIdAndUserId(id, userId);
    if (!event) {
      throw new NotFoundError('Không tìm thấy sự kiện lịch yêu cầu');
    }
    return this.mapDto(event);
  }

  async createEvent(userId: string, dto: CreateScheduleEventDto): Promise<ScheduleEventResponseDto> {
    const firstEvent = await this.repo.create(userId, dto);

    // Nếu là sự kiện lặp lại nhiều tuần (cho cả học kỳ)
    if (dto.isRecurring && dto.repeatWeeks && dto.repeatWeeks > 1) {
      const maxWeeks = Math.min(dto.repeatWeeks, 20); // Tối đa 20 tuần học kỳ
      const baseStart = new Date(dto.startTime);
      const baseEnd = new Date(dto.endTime);

      for (let week = 1; week < maxWeeks; week++) {
        const nextStart = new Date(baseStart.getTime() + week * 7 * 24 * 60 * 60 * 1000);
        const nextEnd = new Date(baseEnd.getTime() + week * 7 * 24 * 60 * 60 * 1000);

        await this.repo.create(userId, {
          ...dto,
          startTime: nextStart.toISOString(),
          endTime: nextEnd.toISOString(),
          isRecurring: true,
          recurrenceRule: `WEEKLY;COUNT=${maxWeeks};INDEX=${week + 1}`
        });
      }
    }

    return this.mapDto(firstEvent);
  }

  async updateEvent(id: string, userId: string, dto: UpdateScheduleEventDto): Promise<ScheduleEventResponseDto> {
    await this.getEventById(id, userId);
    const updated = await this.repo.update(id, userId, dto);
    return this.mapDto(updated);
  }

  async deleteEvent(id: string, userId: string): Promise<void> {
    await this.getEventById(id, userId);
    await this.repo.softDelete(id, userId);
  }
}
