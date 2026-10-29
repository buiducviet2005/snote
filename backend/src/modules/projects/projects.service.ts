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
import { NotFoundError, ValidationError, ForbiddenError, ConflictError } from '../../shared/errors/appErrors';
import { prisma } from '../../shared/db/prismaClient';

export class ProjectsService {
  constructor(private readonly repo: ProjectsRepository = new ProjectsRepository()) {}

  private mapDto(project: any): ProjectResponseDto {
    const existingUserIds = new Set((project.members || []).map((m: any) => m.userId));
    const mergedMembers = [...(project.members || [])];
    if (project.workspace?.members) {
      for (const wm of project.workspace.members) {
        if (!existingUserIds.has(wm.userId)) {
          existingUserIds.add(wm.userId);
          mergedMembers.push({
            id: wm.id,
            projectId: project.id,
            userId: wm.userId,
            role: wm.role === 'OWNER' ? 'OWNER' : wm.role === 'MANAGER' ? 'ADMIN' : wm.role === 'VIEWER' ? 'VIEWER' : 'MEMBER',
            status: wm.status,
            joinedAt: wm.joinedAt,
            user: wm.user
          });
        }
      }
    }

    return {
      id: project.id,
      userId: project.userId,
      classId: project.classId,
      groupId: project.groupId,
      name: project.name,
      description: project.description,
      semesterId: project.semesterId,
      subjectId: project.subjectId,
      status: project.status,
      startDate: project.startDate,
      dueDate: project.dueDate,
      notesCount: project._count?.notes ?? 0,
      tasksCount: project._count?.tasks ?? 0,
      membersCount: mergedMembers.filter((member: any) => member.status === 'ACCEPTED').length,
      members: mergedMembers.map((m: any): ProjectMemberDto => ({
        id: m.id,
        projectId: m.projectId,
        userId: m.userId,
        role: m.role,
        status: m.status,
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
      throw new NotFoundError('Không tìm thấy dự án yêu cầu hoặc bạn không có quyền truy cập');
    }
    return this.mapDto(project);
  }

  async getProjectWorkspace(id: string, userId: string): Promise<ProjectWorkspaceDto> {
    const project = await this.repo.findWorkspaceById(id, userId);
    if (!project) {
      throw new NotFoundError('Không tìm thấy dự án hoặc bạn chưa là thành viên của dự án này');
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
    const project = await this.getProjectById(id, userId);
    if (project.classId) {
      throw new ForbiddenError('Dự án lớp học phải được quản lý trong không gian lớp học');
    }
    const currentMember = project.members?.find((m) => m.userId === userId);
    if (currentMember?.role === 'VIEWER') {
      throw new ForbiddenError('Tài khoản của bạn chỉ có quyền Người xem (Viewer), không thể chỉnh sửa thông tin dự án');
    }
    const updated = await this.repo.update(id, userId, dto);
    return this.mapDto(updated);
  }

  async deleteProject(id: string, userId: string): Promise<void> {
    const project = await this.getProjectById(id, userId);
    if (project.classId) {
      throw new ForbiddenError('Dự án lớp học phải được quản lý trong không gian lớp học');
    }
    const memberRole = project.members?.find((m) => m.userId === userId)?.role;
    if (memberRole !== 'OWNER') {
      throw new ForbiddenError('Chỉ Trưởng nhóm (Owner) mới có quyền xóa toàn bộ dự án / bài tập lớn này');
    }
    await this.repo.softDelete(id, userId);
  }

  private async getManagerRole(project: any, currentUserId: string): Promise<'OWNER' | 'ADMIN' | null> {
    const currentMember = project.members?.find((m: any) => m.userId === currentUserId);
    if (currentMember?.role === 'OWNER' || project.userId === currentUserId) return 'OWNER';
    if (currentMember?.role === 'ADMIN') return 'ADMIN';
    if (project.classId) {
      const courseClass = await prisma.courseClass.findFirst({
        where: { id: project.classId, deletedAt: null },
        include: { members: { where: { userId: currentUserId }, select: { role: true } } }
      });
      if (courseClass && (courseClass.teacherId === currentUserId || courseClass.members[0]?.role === 'CLASS_ADMIN')) {
        return 'OWNER';
      }
    }
    return null;
  }

  async addMember(projectId: string, currentUserId: string, dto: AddProjectMemberDto): Promise<ProjectResponseDto> {
    const project = await this.getProjectById(projectId, currentUserId);
    const managerRole = await this.getManagerRole(project, currentUserId);
    if (!managerRole) {
      throw new ForbiddenError('Chỉ Trưởng nhóm (Owner) hoặc Quản trị viên (Admin) mới có quyền mời thành viên vào dự án');
    }

    // Admin không thể tự phong thành viên mới thành ADMIN
    if (managerRole === 'ADMIN' && dto.role === 'ADMIN') {
      throw new ForbiddenError('Vai trò quản trị và chủ sở hữu chỉ được thay đổi bởi chủ dự án');
    }

    // Tìm target user theo email hoặc userId an toàn tránh lỗi cú pháp UUID
    const rawInput = dto.emailOrUserId || (dto as any).userId || (dto as any).email || '';
    const input = String(rawInput).trim();
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
    if (targetUser.status !== 'ACTIVE') throw new ForbiddenError('Không thể mời tài khoản không hoạt động');
    if (project.members?.some((member) => member.userId === targetUser.id && member.status !== 'DECLINED')) {
      throw new ConflictError('Người này đã là thành viên hoặc đã có lời mời đang chờ');
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
    const managerRole = await this.getManagerRole(project, currentUserId);
    if (!managerRole) {
      throw new ForbiddenError('Chỉ Trưởng nhóm (Owner) hoặc Quản trị viên (Admin) mới có quyền phân quyền thành viên');
    }

    const targetMember = project.members?.find((m) => m.userId === targetUserId);
    if (!targetMember) {
      throw new NotFoundError('Không tìm thấy thành viên trong dự án này');
    }
    if (targetMember.status !== 'ACCEPTED') {
      throw new ForbiddenError('Chỉ có thể đổi vai trò của thành viên đã tham gia');
    }
    if (targetMember.role === 'OWNER' && targetUserId === currentUserId && dto.role !== 'OWNER') {
      throw new ValidationError('Hãy chuyển quyền chủ dự án cho thành viên khác trước');
    }
    if (dto.role === 'OWNER' && managerRole !== 'OWNER') {
      throw new ForbiddenError('Chỉ chủ dự án được chuyển quyền sở hữu');
    }

    // Nếu current user là ADMIN:
    if (managerRole === 'ADMIN') {
      if (targetMember.role === 'OWNER') {
        throw new ForbiddenError('Quản trị viên không thể thay đổi vai trò của Trưởng nhóm');
      }
      if (targetMember.role === 'ADMIN' && targetUserId !== currentUserId) {
        throw new ForbiddenError('Quản trị viên không thể thay đổi vai trò của Quản trị viên khác');
      }
      if (dto.role === 'OWNER') {
        throw new ForbiddenError('Chỉ Trưởng nhóm mới có quyền chuyển giao quyền Trưởng nhóm');
      }
      if (dto.role === 'ADMIN') {
        throw new ForbiddenError('Chỉ chủ dự án được chỉ định quản trị viên');
      }
    }

    await this.repo.updateMemberRole(projectId, targetUserId, dto.role, project.userId);
    return this.getProjectById(projectId, currentUserId);
  }

  async removeMember(projectId: string, currentUserId: string, targetUserId: string): Promise<void> {
    const project = await this.getProjectById(projectId, currentUserId);
    const isSelf = currentUserId === targetUserId;
    const targetMember = project.members?.find((m) => m.userId === targetUserId);

    if (!targetMember) {
      throw new NotFoundError('Không tìm thấy thành viên cần thao tác trong dự án');
    }

    if (targetMember.role === 'OWNER' || project.userId === targetUserId) {
      throw new ValidationError('Hãy chuyển quyền chủ dự án cho thành viên khác trước khi rời dự án');
    }
    if (isSelf) {
      if (targetMember.status !== 'ACCEPTED') throw new ForbiddenError('Bạn chưa tham gia dự án này');
    } else {
      const managerRole = await this.getManagerRole(project, currentUserId);
      if (managerRole === 'OWNER') {
        // Owner có quyền kick bất kỳ ai khác
      } else if (managerRole === 'ADMIN') {
        // Admin có thể kick MEMBER hoặc VIEWER, nhưng KHÔNG kick OWNER hoặc ADMIN khác
        if (targetMember.role === 'ADMIN') {
          throw new ForbiddenError('Quản trị viên không thể xóa Quản trị viên khác khỏi dự án');
        }
      } else {
        throw new ForbiddenError('Bạn không có quyền xóa thành viên này khỏi dự án');
      }
    }

    await this.repo.removeMember(projectId, targetUserId);
  }

  async getInvitations(userId: string): Promise<any[]> {
    return this.repo.findInvitations(userId);
  }

  async respondInvitation(projectId: string, userId: string, accept: boolean): Promise<void> {
    const result = await this.repo.respondToInvitation(projectId, userId, accept);
    if (!result.count) throw new NotFoundError('Không tìm thấy lời mời dự án đang chờ phản hồi');
  }
}
