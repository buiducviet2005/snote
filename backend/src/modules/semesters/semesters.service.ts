import { SemestersRepository } from './semesters.repository';
import { CreateSemesterDto, UpdateSemesterDto, SemesterResponseDto } from './semesters.types';
import { NotFoundError } from '../../shared/errors/appErrors';

export class SemestersService {
  constructor(private readonly repo: SemestersRepository = new SemestersRepository()) {}

  private mapDto(semester: any): SemesterResponseDto {
    return {
      id: semester.id,
      name: semester.name,
      academicYear: semester.academicYear,
      startDate: semester.startDate,
      endDate: semester.endDate,
      status: semester.status,
      isCurrent: semester.isCurrent,
      subjectsCount: semester._count?.subjects,
      createdAt: semester.createdAt,
      updatedAt: semester.updatedAt
    };
  }

  async getAllSemesters(userId: string): Promise<SemesterResponseDto[]> {
    const list = await this.repo.findByUserId(userId);
    return list.map((s) => this.mapDto(s));
  }

  async getSemesterById(id: string, userId: string): Promise<SemesterResponseDto> {
    const semester = await this.repo.findByIdAndUserId(id, userId);
    if (!semester) {
      throw new NotFoundError('Không tìm thấy học kỳ yêu cầu');
    }
    return this.mapDto(semester);
  }

  async createSemester(userId: string, dto: CreateSemesterDto): Promise<SemesterResponseDto> {
    const semester = await this.repo.create(userId, dto);
    return this.mapDto(semester);
  }

  async updateSemester(id: string, userId: string, dto: UpdateSemesterDto): Promise<SemesterResponseDto> {
    await this.getSemesterById(id, userId);
    const updated = await this.repo.update(id, userId, dto);
    return this.mapDto(updated);
  }

  async deleteSemester(id: string, userId: string): Promise<void> {
    await this.getSemesterById(id, userId);
    await this.repo.softDelete(id, userId);
  }
}
