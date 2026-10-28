import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError
} from '../../shared/errors/appErrors';
import {
  canPerformWorkspaceAction,
  isValidTimeZone,
  workspaceCapabilities,
  workspaceLimits,
  workspacePermissions
} from './workspaces.policy';
import {
  WorkspaceRepository,
  type ContextRecord,
  type WorkspaceMemberRecord,
  type WorkspaceRecord,
  type WorkspaceRepositoryPort
} from './workspaces.repository';
import type {
  CreateWorkspaceInput,
  CursorPayload,
  PageMeta,
  WorkspaceContextDto,
  WorkspaceDto,
  WorkspaceListInput,
  WorkspaceMemberDto
} from './workspaces.types';

export interface ListResult<T> {
  data: T[];
  meta: PageMeta;
}

export class WorkspacesService {
  constructor(private readonly repo: WorkspaceRepositoryPort = new WorkspaceRepository()) {}

  private mapWorkspace(workspace: WorkspaceRecord): WorkspaceDto {
    return {
      id: workspace.id,
      type: workspace.type,
      name: workspace.name,
      ownerId: workspace.ownerId,
      status: workspace.status,
      timezone: workspace.timezone,
      project: workspace.project,
      subject: workspace.subject,
      version: workspace.version,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt
    };
  }

  private mapMember(member: WorkspaceMemberRecord): WorkspaceMemberDto {
    return {
      id: member.id,
      workspaceId: member.workspaceId,
      userId: member.userId,
      role: member.role,
      status: member.status,
      version: member.version,
      joinedAt: member.joinedAt,
      user: member.user
    };
  }

  private mapContext(workspace: ContextRecord): WorkspaceContextDto {
    const membership = workspace.members[0];
    if (!membership) {
      throw new NotFoundError('Không tìm thấy workspace hoặc membership đã được chấp nhận');
    }

    return {
      workspace: this.mapWorkspace(workspace),
      membership: this.mapMember(membership),
      effectivePermissions: workspacePermissions(membership.role, workspace.status),
      capabilities: workspaceCapabilities(membership.role),
      policy: {
        reviewRequired: false,
        selfReviewAllowed: false,
        editOthersNotes: false,
        editOthersDocuments: false
      },
      limits: workspaceLimits
    };
  }

  private encodeCursor(cursor: Omit<CursorPayload, 'createdAt'> & { createdAt: Date }): string {
    return Buffer.from(JSON.stringify({
      id: cursor.id,
      createdAt: cursor.createdAt.toISOString()
    })).toString('base64url');
  }

  private decodeCursor(value?: string): CursorPayload | null {
    if (!value) return null;
    try {
      const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as CursorPayload;
      const date = new Date(parsed.createdAt);
      if (
        typeof parsed.id !== 'string'
        || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parsed.id)
        || Number.isNaN(date.getTime())
      ) {
        throw new Error('invalid cursor');
      }
      return parsed;
    } catch {
      throw new ValidationError('Cursor không hợp lệ');
    }
  }

  async list(userId: string, input: WorkspaceListInput): Promise<ListResult<WorkspaceDto>> {
    const rows = await this.repo.listAcceptedWorkspaces(userId, input, this.decodeCursor(input.cursor));
    const hasMore = rows.length > input.limit;
    const page = rows.slice(0, input.limit);
    const last = page.at(-1);
    return {
      data: page.map((workspace) => this.mapWorkspace(workspace)),
      meta: {
        limit: input.limit,
        hasMore,
        nextCursor: hasMore && last
          ? this.encodeCursor({ id: last.id, createdAt: last.createdAt })
          : null
      }
    };
  }

  async getContext(workspaceId: string, userId: string): Promise<WorkspaceContextDto> {
    const workspace = await this.repo.findAcceptedContext(workspaceId, userId);
    if (!workspace) {
      throw new NotFoundError('Không tìm thấy workspace hoặc bạn chưa là thành viên');
    }
    this.assertAction(workspace, 'workspace.read');
    return this.mapContext(workspace);
  }

  async listMembers(
    workspaceId: string,
    userId: string,
    cursor: string | undefined,
    limit: number
  ): Promise<ListResult<WorkspaceMemberDto>> {
    const workspace = await this.repo.findAcceptedContext(workspaceId, userId);
    if (!workspace) {
      throw new NotFoundError('Không tìm thấy workspace hoặc bạn chưa là thành viên');
    }
    this.assertAction(workspace, 'member.read');

    const rows = await this.repo.listAcceptedMembers(
      workspaceId,
      userId,
      this.decodeCursor(cursor),
      limit
    );
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    const last = page.at(-1);
    return {
      data: page.map((member) => this.mapMember(member)),
      meta: {
        limit,
        hasMore,
        nextCursor: hasMore && last
          ? this.encodeCursor({ id: last.id, createdAt: last.joinedAt ?? new Date(0) })
          : null
      }
    };
  }

  async create(userId: string, input: CreateWorkspaceInput): Promise<WorkspaceContextDto> {
    const userTimezone = await this.repo.findUserTimezone(userId);
    if (!userTimezone) {
      throw new NotFoundError('Không tìm thấy tài khoản đang hoạt động');
    }
    const timezone = input.timezone
      ?? (isValidTimeZone(userTimezone) ? userTimezone : 'Asia/Ho_Chi_Minh');

    if (input.type === 'PERSONAL') {
      const existing = await this.repo.findPersonalWorkspace(userId);
      if (existing) {
        throw new ConflictError('PERSONAL workspace đã tồn tại', { workspaceId: existing.id });
      }
      return this.mapContext(await this.createWithConflict(
        () => this.repo.createPersonal(userId, input.name, timezone)
      ));
    }

    if (input.type === 'SUBJECT') {
      const subjectId = input.subject?.subjectId;
      if (!subjectId) throw new ValidationError('SUBJECT workspace thiếu subjectId');
      const subject = await this.repo.findOwnedSubject(subjectId, userId);
      if (!subject) {
        throw new NotFoundError('Không tìm thấy subject hoặc bạn không sở hữu subject này');
      }
      const existing = await this.repo.findSubjectWorkspace(subjectId);
      if (existing) {
        throw new ConflictError('SUBJECT workspace đã tồn tại', { workspaceId: existing.id });
      }
      return this.mapContext(await this.createWithConflict(
        () => this.repo.createSubject(userId, input.name, timezone, subjectId)
      ));
    }

    const project = input.project;
    if (!project) throw new ValidationError('PROJECT workspace thiếu metadata project');
    if (project.semesterId) {
      const semester = await this.repo.findOwnedSemester(project.semesterId, userId);
      if (!semester) {
        throw new NotFoundError('Không tìm thấy semester hoặc bạn không sở hữu semester này');
      }
    }
    if (project.subjectId) {
      const subject = await this.repo.findOwnedSubject(project.subjectId, userId);
      if (!subject) {
        throw new NotFoundError('Không tìm thấy subject hoặc bạn không sở hữu subject này');
      }
    }
    if (project.startDate && project.dueDate && project.startDate > project.dueDate) {
      throw new ValidationError('startDate phải nhỏ hơn hoặc bằng dueDate');
    }

    return this.mapContext(await this.createWithConflict(
      () => this.repo.createProject(userId, input.name, timezone, project)
    ));
  }

  private assertAction(workspace: ContextRecord, action: string): void {
    const membership = workspace.members[0];
    if (!membership) {
      throw new NotFoundError('Không tìm thấy workspace hoặc bạn chưa là thành viên');
    }
    if (!canPerformWorkspaceAction(membership.role, workspace.status, action)) {
      throw new ForbiddenError('Bạn không có quyền thực hiện thao tác workspace này');
    }
  }

  private async createWithConflict<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictError('Workspace liên kết đã tồn tại hoặc đã được tạo đồng thời');
      }
      throw error;
    }
  }

  async addMember(
    workspaceId: string,
    actorId: string,
    email: string,
    role?: import('@prisma/client').WorkspaceRole
  ): Promise<WorkspaceMemberDto> {
    const workspace = await this.repo.findAcceptedContext(workspaceId, actorId);
    if (!workspace) {
      throw new NotFoundError('Không tìm thấy workspace hoặc bạn chưa là thành viên');
    }
    this.assertAction(workspace, 'member.invite');
    const member = await this.repo.addMember(
      workspaceId,
      actorId,
      email,
      role ?? 'MEMBER'
    );
    return this.mapMember(member);
  }

  async listInvitations(userId: string): Promise<any[]> {
    const rows = await this.repo.listInvitations(userId);
    return rows.map((row: any) => ({
      id: row.id,
      workspaceId: row.workspaceId,
      workspace: this.mapWorkspace(row.workspace),
      role: row.role,
      status: row.status,
      invitedAt: row.invitedAt,
      invitedBy: row.invitedBy
    }));
  }

  async acceptInvitation(memberId: string, userId: string): Promise<WorkspaceContextDto> {
    const workspaceId = await this.repo.acceptInvitation(memberId, userId);
    return this.getContext(workspaceId, userId);
  }

  async declineInvitation(memberId: string, userId: string): Promise<void> {
    await this.repo.declineInvitation(memberId, userId);
  }

  async join(userId: string, codeOrId: string): Promise<WorkspaceContextDto> {
    const workspaceId = await this.repo.joinWorkspace(userId, codeOrId.trim());
    return this.getContext(workspaceId, userId);
  }
}
