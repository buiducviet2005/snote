import { TasksRepository } from './tasks.repository';
import { CreateTaskDto, UpdateTaskDto, TaskFilter, TaskResponseDto } from './tasks.types';
import { NotFoundError, ForbiddenError } from '../../shared/errors/appErrors';

export class TasksService {
  constructor(private readonly repository: TasksRepository = new TasksRepository()) {}

  private mapDto(task: any, currentUserId?: string): TaskResponseDto {
    const assigneesList = (task.assignees || [])
      .map((a: any) => a.user)
      .filter(Boolean);

    if (assigneesList.length === 0 && task.user) {
      assigneesList.push(task.user);
    }

    let canComplete = true;
    let canEdit = true;

    if (currentUserId) {
      const isCreator = task.userId === currentUserId;
      const isAssignee = assigneesList.some((u: any) => u.id === currentUserId);
      const isProjectOwner =
        task.project?.userId === currentUserId ||
        (task.project?.members || []).some((m: any) => m.userId === currentUserId && m.role === 'OWNER');

      canComplete = isCreator || isAssignee || isProjectOwner;
      canEdit = isCreator || isAssignee || isProjectOwner;
    }

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
      assignees: assigneesList,
      assignee: assigneesList[0] || task.user,
      canComplete,
      canEdit,
      subject: task.subject,
      project: task.project,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };
  }

  async getTasks(userId: string, filter?: TaskFilter): Promise<{ tasks: TaskResponseDto[]; total: number }> {
    const { tasks, total } = await this.repository.findMany(userId, filter);
    return {
      tasks: tasks.map((t) => this.mapDto(t, userId)),
      total
    };
  }

  async getTaskById(id: string, userId: string): Promise<TaskResponseDto> {
    const task = await this.repository.findById(id, userId);
    if (!task) {
      throw new NotFoundError('Không tìm thấy công việc yêu cầu');
    }
    return this.mapDto(task, userId);
  }

  async createTask(userId: string, dto: CreateTaskDto): Promise<TaskResponseDto> {
    const task = await this.repository.create(userId, dto);
    return this.mapDto(task, userId);
  }

  async updateTask(id: string, userId: string, dto: UpdateTaskDto): Promise<TaskResponseDto> {
    const task = await this.repository.findById(id, userId);
    if (!task) {
      throw new NotFoundError('Không tìm thấy công việc yêu cầu');
    }

    const assigneesList = (task.assignees || []).map((a: any) => a.user).filter(Boolean);
    const isCreator = task.userId === userId;
    const isAssignee = assigneesList.some((u: any) => u.id === userId);
    const isProjectOwner =
      task.project?.userId === userId ||
      (task.project?.members || []).some((m: any) => m.userId === userId && m.role === 'OWNER');

    if (!isCreator && !isAssignee && !isProjectOwner) {
      throw new ForbiddenError('Chỉ thành viên phụ trách công việc này hoặc Trưởng nhóm mới có quyền chỉnh sửa');
    }

    const updated = await this.repository.update(id, userId, dto);
    return this.mapDto(updated, userId);
  }

  async deleteTask(id: string, userId: string): Promise<void> {
    const task = await this.repository.findById(id, userId);
    if (!task) {
      throw new NotFoundError('Không tìm thấy công việc yêu cầu');
    }

    const isCreator = task.userId === userId;
    const isProjectOwner =
      task.project?.userId === userId ||
      (task.project?.members || []).some((m: any) => m.userId === userId && m.role === 'OWNER');

    if (!isCreator && !isProjectOwner) {
      throw new ForbiddenError('Chỉ người tạo công việc hoặc Trưởng nhóm mới có quyền xóa');
    }

    await this.repository.softDelete(id, userId);
  }

  async updateStatus(id: string, userId: string, status: any): Promise<TaskResponseDto> {
    const task = await this.repository.findById(id, userId);
    if (!task) {
      throw new NotFoundError('Không tìm thấy công việc yêu cầu');
    }

    const assigneesList = (task.assignees || []).map((a: any) => a.user).filter(Boolean);
    const isCreator = task.userId === userId;
    const isAssignee = assigneesList.some((u: any) => u.id === userId);
    const isProjectOwner =
      task.project?.userId === userId ||
      (task.project?.members || []).some((m: any) => m.userId === userId && m.role === 'OWNER');

    if (!isCreator && !isAssignee && !isProjectOwner) {
      throw new ForbiddenError('Chỉ thành viên được giao việc hoặc Trưởng nhóm mới có quyền cập nhật trạng thái công việc này');
    }

    const updated = await this.repository.update(id, userId, { status });
    return this.mapDto(updated, userId);
  }
}
