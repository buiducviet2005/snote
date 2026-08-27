import { ScheduleRepository } from './schedule.repository';
import { CreateScheduleEventDto, UpdateScheduleEventDto, ScheduleEventResponseDto } from './schedule.types';
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
  ): Promise<ScheduleEventResponseDto[]> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const list = await this.repo.findByRange(userId, start, end, semesterId, subjectId);
    return list.map((e) => this.mapDto(e));
  }

  async getEventById(id: string, userId: string): Promise<ScheduleEventResponseDto> {
    const event = await this.repo.findByIdAndUserId(id, userId);
    if (!event) {
      throw new NotFoundError('Không tìm thấy sự kiện lịch yêu cầu');
    }
    return this.mapDto(event);
  }

  async createEvent(userId: string, dto: CreateScheduleEventDto): Promise<ScheduleEventResponseDto> {
    const event = await this.repo.create(userId, dto);
    return this.mapDto(event);
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
