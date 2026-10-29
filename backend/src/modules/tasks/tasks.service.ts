import { TasksRepository } from './tasks.repository';
import { CreateTaskDto, UpdateTaskDto, TaskFilter, TaskResponseDto } from './tasks.types';
import { NotFoundError, ForbiddenError } from '../../shared/errors/appErrors';
import { allowedAssignees, allowedSubject, writableProject } from '../../shared/security/studyAccess';
import { resolveWorkspaceScope } from '../../shared/security/workspaceScope';

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
        (task.project?.members || []).some((m: any) => m.userId === currentUserId && m.role === 'OWNER') ||
        task.project?.workspace?.ownerId === currentUserId ||
        (task.project?.workspace?.members || []).some((m: any) => m.userId === currentUserId && m.role === 'OWNER');

      const isGroupOwner = task.workspace?.type === 'GROUP' && task.workspace?.ownerId === currentUserId;
      canComplete = isCreator || isAssignee || isProjectOwner || isGroupOwner;
      canEdit = isCreator || isAssignee || isProjectOwner || isGroupOwner;
    }

    return {
      id: task.id,
      userId: task.userId,
      subjectId: task.subjectId,
      projectId: task.projectId,
      workspaceId: task.workspaceId,
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
    if (filter?.workspaceId) {
      const workspace = await resolveWorkspaceScope(filter.workspaceId, userId);
      if (workspace.type === 'PROJECT' && !workspace.projectId) throw new NotFoundError('Không gian dự án chưa có dữ liệu');
      if (workspace.type === 'SUBJECT' && !workspace.subjectId) throw new NotFoundError('Không gian môn học chưa có dữ liệu');
      filter = {
        ...filter,
        subjectId: workspace.type === 'SUBJECT' ? workspace.subjectId ?? undefined : undefined,
        projectId: workspace.type === 'PROJECT' ? workspace.projectId ?? undefined : undefined,
        personalScope: workspace.type === 'PERSONAL'
      };
      if (workspace.type === 'GROUP') filter.groupWorkspaceId = workspace.id;
    }
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
    const scope = dto.workspaceId ? await resolveWorkspaceScope(dto.workspaceId, userId) : null;
    if (scope?.status === 'ARCHIVED') throw new ForbiddenError('Không thể tạo công việc trong không gian đã lưu trữ');
    if (scope?.type === 'GROUP' && (dto.projectId || dto.subjectId)) throw new ForbiddenError('Công việc nhóm không thuộc dự án hoặc môn học cá nhân');
    if (scope?.type === 'PROJECT' && dto.projectId !== scope.projectId) throw new ForbiddenError('Dự án không khớp không gian đã chọn');
    if (scope?.type === 'SUBJECT' && dto.subjectId !== scope.subjectId) throw new ForbiddenError('Môn học không khớp không gian đã chọn');
    if (scope?.type === 'PERSONAL' && (dto.projectId || dto.subjectId)) throw new ForbiddenError('Công việc cá nhân không thuộc dự án khác');
    const project = dto.projectId ? await writableProject(dto.projectId, userId) : null;
    if (dto.subjectId) await allowedSubject(dto.subjectId, userId, project?.subjectId);
    const requested = dto.assigneeIds?.length ? dto.assigneeIds : dto.assigneeId ? [dto.assigneeId] : [];
    if (requested.length) {
      if (scope?.type === 'GROUP' && requested.some((id) => !scope.members.some((member) => member.userId === id))) {
        throw new ForbiddenError('Chỉ được giao việc cho thành viên nhóm');
      }
      if (scope?.type !== 'GROUP') {
      allowedAssignees(
        requested,
        userId,
        project?.members,
        project?.workspace?.members,
        project?.userId
      );
      }
    }
    const hasMembership =
      (project?.members || []).some((member) => member.userId === userId) ||
      (project?.workspace?.members || []).some((member) => member.userId === userId);
    const defaultAssignee = project && !hasMembership && project.userId !== userId
      ? project.userId : userId;
    const task = await this.repository.create(userId, requested.length ? dto : { ...dto, assigneeIds: [defaultAssignee] });
    return this.mapDto(task, userId);
  }

  async updateTask(id: string, userId: string, dto: UpdateTaskDto): Promise<TaskResponseDto> {
    const task = await this.repository.findById(id, userId);
    if (!task) {
      throw new NotFoundError('Không tìm thấy công việc yêu cầu');
    }

    if (task.workspace?.type === 'GROUP') {
      if (dto.projectId || dto.subjectId) throw new ForbiddenError('Không thể chuyển công việc nhóm sang dự án hoặc môn học');
      const scope = await resolveWorkspaceScope(task.workspaceId, userId);
      if (scope.status === 'ARCHIVED') throw new ForbiddenError('Không thể sửa công việc trong không gian đã lưu trữ');
    }

    const assigneesList = (task.assignees || []).map((a: any) => a.user).filter(Boolean);
    const isCreator = task.userId === userId;
    const isAssignee = assigneesList.some((u: any) => u.id === userId);
    const isProjectOwner =
      task.project?.userId === userId ||
      (task.project?.members || []).some((m: any) => m.userId === userId && m.role === 'OWNER') ||
      task.project?.workspace?.ownerId === userId ||
      (task.project?.workspace?.members || []).some((m: any) => m.userId === userId && m.role === 'OWNER');

    if (!isCreator && !isAssignee && !isProjectOwner && task.workspace?.ownerId !== userId) {
      throw new ForbiddenError('Chỉ thành viên phụ trách công việc này hoặc Trưởng nhóm mới có quyền chỉnh sửa');
    }

    const projectId = dto.projectId === undefined ? task.projectId : dto.projectId;
    const project = projectId ? await writableProject(projectId, userId) : null;
    if (dto.subjectId) await allowedSubject(dto.subjectId, userId, project?.subjectId);
    const requested = dto.assigneeIds !== undefined ? dto.assigneeIds : dto.assigneeId ? [dto.assigneeId] : null;
    if (requested) {
      const groupScope = task.workspaceId ? await resolveWorkspaceScope(task.workspaceId, userId) : null;
      if (groupScope?.type === 'GROUP' && requested.some((id) => !groupScope.members.some((member) => member.userId === id))) {
        throw new ForbiddenError('Chỉ được giao việc cho thành viên nhóm');
      }
      if (groupScope?.type !== 'GROUP') {
      allowedAssignees(
        requested,
        userId,
        project?.members,
        project?.workspace?.members,
        project?.userId
      );
      }
    }

    const updated = await this.repository.update(id, userId, dto);
    return this.mapDto(updated, userId);
  }

  async deleteTask(id: string, userId: string): Promise<void> {
    const task = await this.repository.findById(id, userId);
    if (!task) {
      throw new NotFoundError('Không tìm thấy công việc yêu cầu');
    }
    if (task.workspace?.type === 'GROUP') {
      const scope = await resolveWorkspaceScope(task.workspaceId, userId);
      if (scope.status === 'ARCHIVED') throw new ForbiddenError('Không thể xóa công việc trong không gian đã lưu trữ');
    }

    const isCreator = task.userId === userId;
    const isProjectOwner =
      task.project?.userId === userId ||
      (task.project?.members || []).some((m: any) => m.userId === userId && m.role === 'OWNER') ||
      task.project?.workspace?.ownerId === userId ||
      (task.project?.workspace?.members || []).some((m: any) => m.userId === userId && m.role === 'OWNER');

    if (!isCreator && !isProjectOwner && task.workspace?.ownerId !== userId) {
      throw new ForbiddenError('Chỉ người tạo công việc hoặc Trưởng nhóm mới có quyền xóa');
    }

    await this.repository.softDelete(id, userId);
  }

  async updateStatus(id: string, userId: string, status: any): Promise<TaskResponseDto> {
    const task = await this.repository.findById(id, userId);
    if (!task) {
      throw new NotFoundError('Không tìm thấy công việc yêu cầu');
    }
    if (task.workspace?.type === 'GROUP') {
      const scope = await resolveWorkspaceScope(task.workspaceId, userId);
      if (scope.status === 'ARCHIVED') throw new ForbiddenError('Không thể cập nhật công việc trong không gian đã lưu trữ');
    }

    const assigneesList = (task.assignees || []).map((a: any) => a.user).filter(Boolean);
    const isCreator = task.userId === userId;
    const isAssignee = assigneesList.some((u: any) => u.id === userId);
    const isProjectOwner =
      task.project?.userId === userId ||
      (task.project?.members || []).some((m: any) => m.userId === userId && m.role === 'OWNER') ||
      task.project?.workspace?.ownerId === userId ||
      (task.project?.workspace?.members || []).some((m: any) => m.userId === userId && m.role === 'OWNER');

    if (!isCreator && !isAssignee && !isProjectOwner && task.workspace?.ownerId !== userId) {
      throw new ForbiddenError('Chỉ thành viên được giao việc hoặc Trưởng nhóm mới có quyền cập nhật trạng thái công việc này');
    }

    const updated = await this.repository.update(id, userId, { status });
    return this.mapDto(updated, userId);
  }
}
