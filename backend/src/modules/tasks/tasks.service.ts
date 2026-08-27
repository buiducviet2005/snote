import { TasksRepository } from './tasks.repository';
import { CreateTaskDto, UpdateTaskDto, TaskFilter, TaskResponseDto } from './tasks.types';
import { NotFoundError, ValidationError } from '../../shared/errors/appErrors';

export class TasksService {
  constructor(private readonly repository: TasksRepository = new TasksRepository()) {}

  private mapDto(task: any): TaskResponseDto {
    return {
      id: task.id,
      userId: task.userId,
      subjectId: task.subjectId,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      tags: (task.taskTags || []).map((tt: any) => ({
        id: tt.tag.id,
        name: tt.tag.name,
        color: tt.tag.color
      })),
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };
  }

  async getTasks(userId: string, filter?: TaskFilter): Promise<{ tasks: TaskResponseDto[]; total: number }> {
    const { tasks, total } = await this.repository.findMany(userId, filter);
    return {
      tasks: tasks.map((t) => this.mapDto(t)),
      total
    };
  }

  async getTaskById(id: string, userId: string): Promise<TaskResponseDto> {
    const task = await this.repository.findById(id, userId);
    if (!task) {
      throw new NotFoundError('Không tìm thấy công việc yêu cầu');
    }
    return this.mapDto(task);
  }

  async createTask(userId: string, dto: CreateTaskDto): Promise<TaskResponseDto> {
    if (!dto.subjectId && !dto.projectId) {
      throw new ValidationError('Công việc bắt buộc phải gắn với ít nhất một Môn học hoặc Đồ án');
    }

    const task = await this.repository.create(userId, dto);
    return this.mapDto(task);
  }

  async updateTask(id: string, userId: string, dto: UpdateTaskDto): Promise<TaskResponseDto> {
    await this.getTaskById(id, userId);
    const updated = await this.repository.update(id, userId, dto);
    return this.mapDto(updated);
  }

  async deleteTask(id: string, userId: string): Promise<void> {
    await this.getTaskById(id, userId);
    await this.repository.softDelete(id, userId);
  }

  async updateStatus(id: string, userId: string, status: any): Promise<TaskResponseDto> {
    await this.getTaskById(id, userId);
    const updated = await this.repository.update(id, userId, { status });
    return this.mapDto(updated);
  }
}
