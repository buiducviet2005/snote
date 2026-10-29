import { ScheduleRepository } from './schedule.repository';
import {
  CreateScheduleEventDto,
  UpdateScheduleEventDto,
  ScheduleEventResponseDto,
  UnifiedScheduleItemDto
} from './schedule.types';
import { ForbiddenError, NotFoundError } from '../../shared/errors/appErrors';
import { resolveWorkspaceScope } from '../../shared/security/workspaceScope';
import { writableProject, allowedSubject } from '../../shared/security/studyAccess';

export class ScheduleService {
  constructor(private readonly repo: ScheduleRepository = new ScheduleRepository()) {}

  private mapDto(event: any): ScheduleEventResponseDto {
    return {
      id: event.id,
      userId: event.userId,
      semesterId: event.semesterId,
      subjectId: event.subjectId,
      projectId: event.projectId,
      workspaceId: event.workspaceId,
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
    subjectId?: string,
    workspaceId?: string
  ): Promise<UnifiedScheduleItemDto[]> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const scope = workspaceId ? await resolveWorkspaceScope(workspaceId, userId) : undefined;
    if (scope?.type === 'PROJECT' && !scope.projectId) throw new NotFoundError('Không gian dự án chưa có dữ liệu');
    if (scope?.type === 'SUBJECT' && !scope.subjectId) throw new NotFoundError('Không gian môn học chưa có dữ liệu');
    return this.repo.findUnifiedSchedule(userId, start, end, scope ? undefined : semesterId, scope ? undefined : subjectId, scope);
  }

  async getEventById(id: string, userId: string): Promise<ScheduleEventResponseDto> {
    const event = await this.repo.findByIdAndUserId(id, userId);
    if (!event) {
      throw new NotFoundError('Không tìm thấy sự kiện lịch yêu cầu');
    }
    return this.mapDto(event);
  }

  async createEvent(userId: string, dto: CreateScheduleEventDto): Promise<ScheduleEventResponseDto> {
    const scope = dto.workspaceId ? await resolveWorkspaceScope(dto.workspaceId, userId) : null;
    if (scope?.status === 'ARCHIVED') throw new ForbiddenError('Không thể tạo lịch trong không gian đã lưu trữ');
    if (scope?.type === 'GROUP' && (dto.projectId || dto.subjectId)) throw new ForbiddenError('Lịch nhóm không thuộc dự án hoặc môn học cá nhân');
    if (scope?.type === 'PROJECT' && dto.projectId !== scope.projectId) throw new ForbiddenError('Dự án không khớp không gian đã chọn');
    if (scope?.type === 'SUBJECT' && dto.subjectId !== scope.subjectId) throw new ForbiddenError('Môn học không khớp không gian đã chọn');
    if (scope?.type === 'PERSONAL' && (dto.projectId || dto.subjectId)) throw new ForbiddenError('Lịch cá nhân không thuộc dự án khác');
    if (dto.projectId) await writableProject(dto.projectId, userId);
    if (dto.subjectId) await allowedSubject(dto.subjectId, userId);
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
    const existing = await this.repo.findByIdAndUserId(id, userId);
    if (!existing) throw new NotFoundError('Không tìm thấy sự kiện lịch yêu cầu');
    if (existing.userId !== userId) throw new ForbiddenError('Chỉ người tạo được sửa sự kiện lịch');
    if (existing.workspaceId) {
      const scope = await resolveWorkspaceScope(existing.workspaceId, userId);
      if (scope.status === 'ARCHIVED') throw new ForbiddenError('Không thể sửa lịch trong không gian đã lưu trữ');
      if (scope.type === 'GROUP' && (dto.projectId || dto.subjectId)) throw new ForbiddenError('Không thể chuyển lịch nhóm sang không gian khác');
    }
    if (dto.projectId) await writableProject(dto.projectId, userId);
    if (dto.subjectId) await allowedSubject(dto.subjectId, userId);
    const updated = await this.repo.update(id, userId, dto);
    return this.mapDto(updated);
  }

  async deleteEvent(id: string, userId: string): Promise<void> {
    const existing = await this.repo.findByIdAndUserId(id, userId);
    if (!existing) throw new NotFoundError('Không tìm thấy sự kiện lịch yêu cầu');
    if (existing.userId !== userId) throw new ForbiddenError('Chỉ người tạo được xóa sự kiện lịch');
    if (existing.workspaceId) {
      const scope = await resolveWorkspaceScope(existing.workspaceId, userId);
      if (scope.status === 'ARCHIVED') throw new ForbiddenError('Không thể xóa lịch trong không gian đã lưu trữ');
    }
    await this.repo.softDelete(id, userId);
  }
}
