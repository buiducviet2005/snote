import { SubjectsRepository } from './subjects.repository';
import { CreateSubjectDto, UpdateSubjectDto, SubjectResponseDto } from './subjects.types';
import { NotFoundError } from '../../shared/errors/appErrors';

export class SubjectsService {
  constructor(private readonly repo: SubjectsRepository = new SubjectsRepository()) {}

  private mapDto(subject: any): SubjectResponseDto {
    return {
      id: subject.id,
      semesterId: subject.semesterId,
      name: subject.name,
      code: subject.code,
      credits: subject.credits,
      lecturer: subject.lecturer,
      color: subject.color,
      status: subject.status,
      notesCount: subject._count?.notes,
      tasksCount: subject._count?.tasks,
      projectsCount: subject._count?.projects,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt
    };
  }

  async getAllSubjects(userId: string, semesterId?: string): Promise<SubjectResponseDto[]> {
    const list = await this.repo.findByUserId(userId, semesterId);
    return list.map((s) => this.mapDto(s));
  }

  async getSubjectById(id: string, userId: string): Promise<SubjectResponseDto> {
    const subject = await this.repo.findByIdAndUserId(id, userId);
    if (!subject) {
      throw new NotFoundError('Không tìm thấy môn học yêu cầu');
    }
    return this.mapDto(subject);
  }

  async createSubject(userId: string, dto: CreateSubjectDto): Promise<SubjectResponseDto> {
    const subject = await this.repo.create(userId, dto);
    return this.mapDto(subject);
  }

  async updateSubject(id: string, userId: string, dto: UpdateSubjectDto): Promise<SubjectResponseDto> {
    await this.getSubjectById(id, userId);
    const updated = await this.repo.update(id, userId, dto);
    return this.mapDto(updated);
  }

  async deleteSubject(id: string, userId: string): Promise<void> {
    await this.getSubjectById(id, userId);
    await this.repo.softDelete(id, userId);
  }
}
