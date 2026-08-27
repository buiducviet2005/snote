import { ProjectsRepository } from './projects.repository';
import { CreateProjectDto, UpdateProjectDto, ProjectResponseDto, AddProjectMemberDto, ProjectMemberDto } from './projects.types';
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
      throw new NotFoundError('Không tìm thấy đồ án yêu cầu');
    }
    return this.mapDto(project);
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
    await this.getProjectById(id, userId);
    await this.repo.softDelete(id, userId);
  }

  async addMember(projectId: string, currentUserId: string, dto: AddProjectMemberDto): Promise<ProjectResponseDto> {
    const project = await this.getProjectById(projectId, currentUserId);

    // Tìm target user theo email hoặc userId
    const input = dto.emailOrUserId.trim().toLowerCase();
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: input },
          { id: input }
        ],
        deletedAt: null
      }
    });

    if (!targetUser) {
      throw new NotFoundError('Không tìm thấy tài khoản người dùng với thông tin này');
    }

    await this.repo.addMember(projectId, targetUser.id, dto.role || 'MEMBER');
    return this.getProjectById(projectId, currentUserId);
  }

  async removeMember(projectId: string, currentUserId: string, targetUserId: string): Promise<void> {
    await this.getProjectById(projectId, currentUserId);
    await this.repo.removeMember(projectId, targetUserId);
  }
}
