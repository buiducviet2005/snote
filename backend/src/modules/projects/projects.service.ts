import { ProjectsRepository } from './projects.repository';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectResponseDto,
  AddProjectMemberDto,
  ProjectMemberDto,
  UpdateProjectMemberRoleDto,
  ProjectWorkspaceDto
} from './projects.types';
import { NotFoundError, ValidationError, ForbiddenError } from '../../shared/errors/appErrors';
import { prisma } from '../../shared/db/prismaClient';

export class ProjectsService {
  constructor(private readonly repo: ProjectsRepository = new ProjectsRepository()) {}

  private mapDto(project: any): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      semesterId: project.semesterId,
      subjectId: project.subjectId,
      status: project.status,
      startDate: project.startDate,
      dueDate: project.dueDate,
      notesCount: project._count?.notes ?? 0,
      tasksCount: project._count?.tasks ?? 0,
      membersCount: project._count?.members ?? (project.members?.length ?? 0),
      members: project.members?.map((m: any): ProjectMemberDto => ({
        id: m.id,
        projectId: m.projectId,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user ? {
          id: m.user.id,
          email: m.user.email,
          fullName: m.user.fullName,
          avatarUrl: m.user.avatarUrl
        } : undefined
      })),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
  }

  async getAllProjects(userId: string, semesterId?: string, subjectId?: string): Promise<ProjectResponseDto[]> {
    const list = await this.repo.findByUserId(userId, semesterId, subjectId);
    return list.map((p) => this.mapDto(p));
  }

  async getProjectById(id: string, userId: string): Promise<ProjectResponseDto> {
    const project = await this.repo.findByIdAndUserId(id, userId);
    if (!project) {
      throw new NotFoundError('Không tìm thấy đồ án yêu cầu hoặc bạn không có quyền truy cập');
    }
    return this.mapDto(project);
  }

  async getProjectWorkspace(id: string, userId: string): Promise<ProjectWorkspaceDto> {
    const project = await this.repo.findWorkspaceById(id, userId);
    if (!project) {
      throw new NotFoundError('Không tìm thấy đồ án hoặc bạn chưa là thành viên của đồ án này');
    }

    return {
      ...this.mapDto(project),
      subject: project.subject,
      semester: project.semester,
      notes: project.notes.map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        noteType: n.noteType,
        isPinned: n.isPinned,
        isArchived: n.isArchived,
        author: n.user,
        tags: n.noteTags.map((nt: any) => nt.tag),
        createdAt: n.createdAt,
        updatedAt: n.updatedAt
      })),
      tasks: project.tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        completedAt: t.completedAt,
        assignee: t.user,
        tags: t.taskTags.map((tt: any) => tt.tag),
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      }))
    };
  }

  async createProject(userId: string, dto: CreateProjectDto): Promise<ProjectResponseDto> {
    const project = await this.repo.create(userId, dto);
    return this.mapDto(project);
  }

  async updateProject(id: string, userId: string, dto: UpdateProjectDto): Promise<ProjectResponseDto> {
    await this.getProjectById(id, userId);
    const updated = await this.repo.update(id, userId, dto);
    return this.mapDto(updated);
  }

  async deleteProject(id: string, userId: string): Promise<void> {
    const project = await this.getProjectById(id, userId);
    if (project.members?.find((m) => m.userId === userId)?.role !== 'OWNER') {
      throw new ForbiddenError('Chỉ Trưởng nhóm (Owner) mới có quyền xóa toàn bộ đồ án này');
    }
    await this.repo.softDelete(id, userId);
  }

  async addMember(projectId: string, currentUserId: string, dto: AddProjectMemberDto): Promise<ProjectResponseDto> {
    const project = await this.getProjectById(projectId, currentUserId);

    // Kiểm tra quyền: Chỉ OWNER mới có quyền thêm thành viên
    const currentMember = project.members?.find((m) => m.userId === currentUserId);
    if (currentMember && currentMember.role === 'VIEWER') {
      throw new ForbiddenError('Tài khoản của bạn chỉ có quyền Người xem (Viewer), không thể thêm thành viên');
    }

    // Tìm target user theo email hoặc userId an toàn tránh lỗi cú pháp UUID
    const input = dto.emailOrUserId.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);

    const targetUser = await prisma.user.findFirst({
      where: {
        ...(isUuid ? { OR: [{ id: input }, { email: input.toLowerCase() }] } : { email: input.toLowerCase() }),
        deletedAt: null
      }
    });

    if (!targetUser) {
      throw new NotFoundError('Không tìm thấy tài khoản người dùng với thông tin này');
    }

    await this.repo.addMember(projectId, targetUser.id, dto.role || 'MEMBER');
    return this.getProjectById(projectId, currentUserId);
  }

  async updateMemberRole(
    projectId: string,
    currentUserId: string,
    targetUserId: string,
    dto: UpdateProjectMemberRoleDto
  ): Promise<ProjectResponseDto> {
    const project = await this.getProjectById(projectId, currentUserId);

    // Chỉ OWNER mới có quyền thay đổi vai trò
    const currentMember = project.members?.find((m) => m.userId === currentUserId);
    if (!currentMember || currentMember.role !== 'OWNER') {
      throw new ForbiddenError('Chỉ Trưởng nhóm (Owner) mới có quyền thay đổi vai trò thành viên');
    }

    // Nếu chuyển quyền sang OWNER, cập nhật role cho targetUser
    await this.repo.updateMemberRole(projectId, targetUserId, dto.role);
    return this.getProjectById(projectId, currentUserId);
  }

  async removeMember(projectId: string, currentUserId: string, targetUserId: string): Promise<void> {
    const project = await this.getProjectById(projectId, currentUserId);

    // Cho phép tự rời nhóm HOẶC Owner kick member
    const isSelf = currentUserId === targetUserId;
    const isOwner = project.members?.find((m) => m.userId === currentUserId)?.role === 'OWNER';

    if (!isSelf && !isOwner) {
      throw new ForbiddenError('Bạn không có quyền xóa thành viên này khỏi đồ án');
    }

    // Không cho phép xóa Owner duy nhất nếu còn thành viên khác
    const targetMember = project.members?.find((m) => m.userId === targetUserId);
    if (targetMember?.role === 'OWNER' && (project.members?.length || 0) > 1 && isSelf) {
      throw new ValidationError('Vui lòng chuyển giao quyền Trưởng nhóm trước khi rời khỏi đồ án');
    }

    await this.repo.removeMember(projectId, targetUserId);
  }
}
