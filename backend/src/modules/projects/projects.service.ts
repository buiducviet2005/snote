import { ProjectsRepository } from './projects.repository';
import { CreateProjectDto, UpdateProjectDto, ProjectResponseDto } from './projects.types';
import { NotFoundError } from '../../shared/errors/appErrors';

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
      notesCount: project._count?.notes,
      tasksCount: project._count?.tasks,
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
}
