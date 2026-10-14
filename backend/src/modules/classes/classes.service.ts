import { ClassMemberRole, ProjectMemberRole, UserRole } from '@prisma/client';
import { prisma } from '../../shared/db/prismaClient';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors/appErrors';
import { classroomPermissions, classroomProjectWhere } from './classes.policy';

const publicUser = { id: true, fullName: true, email: true, avatarUrl: true } as const;

export class ClassesService {
  private async access(classId: string, userId: string) {
    const courseClass = await prisma.courseClass.findFirst({
      where: { id: classId, deletedAt: null },
      include: { members: { where: { userId }, select: { role: true } } }
    });
    if (!courseClass) throw new NotFoundError('Không tìm thấy lớp học');
    const isTeacher = courseClass.teacherId === userId;
    const memberRole = courseClass.members[0]?.role;
    if (!isTeacher && !memberRole) throw new ForbiddenError('Bạn chưa thuộc lớp học này');
    return { courseClass, isTeacher, memberRole, isManager: classroomPermissions({ isTeacher, classRole: memberRole }).manageClass };
  }

  private async groupAccess(classId: string, groupId: string, userId: string) {
    const access = await this.access(classId, userId);
    const group = await prisma.studyGroup.findFirst({ where: { id: groupId, classId } });
    if (!group) throw new NotFoundError('Không tìm thấy nhóm trong lớp');
    return { ...access, group, isLeader: group.leaderId === userId };
  }

  private async projectAccess(classId: string, projectId: string, userId: string) {
    const access = await this.access(classId, userId);
    const project = await prisma.project.findFirst({
      where: { id: projectId, classId, deletedAt: null },
      include: { studyGroup: { include: { members: { where: { userId } } } } }
    });
    if (!project || !project.studyGroup) throw new NotFoundError('Không tìm thấy dự án trong lớp');
    const isGroupMember = project.studyGroup.members.length > 0;
    if (!classroomPermissions({ isTeacher: access.isTeacher, classRole: access.memberRole, isGroupMember }).viewGroupProject) {
      throw new ForbiddenError('Bạn không thuộc nhóm của dự án này');
    }
    return { ...access, project, isGroupMember, isLeader: project.studyGroup.leaderId === userId };
  }

  async list(userId: string) {
    return prisma.courseClass.findMany({
      where: {
        deletedAt: null,
        OR: [{ teacherId: userId }, { members: { some: { userId } } }]
      },
      include: {
        teacher: { select: publicUser },
        members: { where: { userId }, select: { role: true } },
        _count: { select: { members: true, groups: true, projects: { where: { deletedAt: null } } } }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async get(classId: string, userId: string) {
    const access = await this.access(classId, userId);
    return prisma.courseClass.findUniqueOrThrow({
      where: { id: classId },
      include: {
        teacher: { select: publicUser },
        members: { include: { user: { select: publicUser } }, orderBy: { joinedAt: 'asc' } },
        groups: {
          include: {
            leader: { select: publicUser },
            members: { include: { user: { select: publicUser } } },
            projects: {
              where: classroomProjectWhere(classId, userId, access.isManager),
              include: { _count: { select: { tasks: true, notes: true, progressReports: true } } },
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  async overview(classId: string, userId: string) {
    const access = await this.access(classId, userId);
    const projectWhere = classroomProjectWhere(classId, userId, access.isManager);
    const [projects, pending] = await Promise.all([
      prisma.project.findMany({
        where: projectWhere,
        select: {
          id: true, name: true, status: true, dueDate: true, groupId: true,
          studyGroup: { select: { name: true, leader: { select: publicUser } } },
          _count: { select: { tasks: true, progressReports: true } },
          progressReports: {
            orderBy: { createdAt: 'desc' }, take: 1,
            select: {
              id: true, progressPercent: true, summary: true, blockers: true,
              reviewScore: true, reviewComment: true, reviewedAt: true, createdAt: true
            }
          }
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }]
      }),
      prisma.progressReport.groupBy({
        by: ['projectId'],
        where: { reviewedAt: null, project: projectWhere },
        _count: { _all: true }
      })
    ]);
    const pendingByProject = new Map(pending.map((row) => [row.projectId, row._count._all]));
    return projects.map(({ progressReports, ...project }) => ({
      ...project,
      latestReport: progressReports[0] || null,
      pendingReviews: pendingByProject.get(project.id) || 0
    }));
  }

  async create(userId: string, data: { name: string; code?: string; term?: string; description?: string }) {
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null, status: 'ACTIVE' } });
    if (!user || (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN)) {
      throw new ForbiddenError('Chỉ tài khoản giảng viên được tạo lớp học');
    }
    return prisma.courseClass.create({ data: { teacherId: userId, ...data } });
  }

  async update(classId: string, userId: string, data: { name?: string; code?: string; term?: string; description?: string }) {
    const access = await this.access(classId, userId);
    if (!access.isTeacher) throw new ForbiddenError('Chỉ giảng viên được sửa thông tin lớp');
    return prisma.courseClass.update({ where: { id: classId }, data });
  }

  async addMember(classId: string, userId: string, email: string) {
    const access = await this.access(classId, userId);
    if (!access.isManager) throw new ForbiddenError('Bạn không có quyền quản lý lớp');
    const target = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null, status: 'ACTIVE' },
      select: { id: true, role: true }
    });
    if (!target) throw new NotFoundError('Không tìm thấy tài khoản sinh viên');
    if (target.id === access.courseClass.teacherId || target.role !== UserRole.STUDENT) {
      throw new ValidationError('Chỉ thêm tài khoản sinh viên vào danh sách lớp');
    }
    const existing = await prisma.classMember.findUnique({ where: { classId_userId: { classId, userId: target.id } } });
    if (existing) throw new ConflictError('Sinh viên đã thuộc lớp này');
    return prisma.classMember.create({
      data: { classId, userId: target.id },
      include: { user: { select: publicUser } }
    });
  }

  async setMemberRole(classId: string, userId: string, targetId: string, role: ClassMemberRole) {
    const access = await this.access(classId, userId);
    if (!access.isTeacher) throw new ForbiddenError('Chỉ giảng viên được chỉ định quản trị viên lớp');
    const result = await prisma.classMember.updateMany({ where: { classId, userId: targetId }, data: { role } });
    if (!result.count) throw new NotFoundError('Sinh viên không thuộc lớp');
    return prisma.classMember.findUniqueOrThrow({ where: { classId_userId: { classId, userId: targetId } } });
  }

  async removeMember(classId: string, userId: string, targetId: string) {
    const access = await this.access(classId, userId);
    if (!access.isManager) throw new ForbiddenError('Bạn không có quyền quản lý lớp');
    const target = await prisma.classMember.findUnique({ where: { classId_userId: { classId, userId: targetId } } });
    if (!target) throw new NotFoundError('Sinh viên không thuộc lớp');
    if (target.role === 'CLASS_ADMIN' && !access.isTeacher) throw new ForbiddenError('Chỉ giảng viên được xóa quản trị viên lớp');
    const led = await prisma.studyGroup.count({ where: { classId, leaderId: targetId } });
    if (led) throw new ConflictError('Hãy chuyển vai trò trưởng nhóm trước khi xóa sinh viên khỏi lớp');
    await prisma.$transaction(async (tx) => {
      const groupProjects = await tx.project.findMany({ where: { classId, groupId: { not: null } }, select: { id: true } });
      const projectIds = groupProjects.map((p) => p.id);
      await tx.taskAssignee.deleteMany({ where: { userId: targetId, task: { projectId: { in: projectIds } } } });
      await tx.projectMember.deleteMany({ where: { userId: targetId, projectId: { in: projectIds } } });
      await tx.studyGroupMember.deleteMany({ where: { classId, userId: targetId } });
      await tx.classMember.delete({ where: { classId_userId: { classId, userId: targetId } } });
    });
  }

  async createGroup(classId: string, userId: string, data: { name: string; leaderId: string }) {
    const access = await this.access(classId, userId);
    if (!access.isManager) throw new ForbiddenError('Bạn không có quyền chia nhóm');
    const leader = await prisma.classMember.findUnique({ where: { classId_userId: { classId, userId: data.leaderId } } });
    if (!leader) throw new ValidationError('Trưởng nhóm phải là sinh viên trong lớp');
    const existingGroup = await prisma.studyGroupMember.findUnique({ where: { classId_userId: { classId, userId: data.leaderId } } });
    if (existingGroup) throw new ConflictError('Sinh viên đã thuộc một nhóm khác trong lớp');
    return prisma.studyGroup.create({
      data: { classId, name: data.name, leaderId: data.leaderId, members: { create: { classId, userId: data.leaderId } } },
      include: { leader: { select: publicUser }, members: { include: { user: { select: publicUser } } } }
    });
  }

  async updateGroup(classId: string, groupId: string, userId: string, name: string) {
    const access = await this.groupAccess(classId, groupId, userId);
    if (!access.isManager) throw new ForbiddenError('Chỉ quản lý lớp được đổi tên nhóm');
    return prisma.studyGroup.update({ where: { id: groupId }, data: { name } });
  }

  async deleteGroup(classId: string, groupId: string, userId: string) {
    const access = await this.groupAccess(classId, groupId, userId);
    if (!access.isTeacher) throw new ForbiddenError('Chỉ giảng viên được xóa nhóm');
    const projects = await prisma.project.count({ where: { groupId, deletedAt: null } });
    if (projects) throw new ConflictError('Hãy xử lý các dự án của nhóm trước khi xóa nhóm');
    await prisma.studyGroup.delete({ where: { id: groupId } });
  }

  async addGroupMember(classId: string, groupId: string, userId: string, targetId: string) {
    const access = await this.groupAccess(classId, groupId, userId);
    if (!classroomPermissions({ isTeacher: access.isTeacher, classRole: access.memberRole, isLeader: access.isLeader }).manageGroup) {
      throw new ForbiddenError('Chỉ quản lý lớp hoặc trưởng nhóm được thêm thành viên');
    }
    const target = await prisma.classMember.findUnique({ where: { classId_userId: { classId, userId: targetId } } });
    if (!target) throw new ValidationError('Thành viên phải thuộc lớp học');
    const existing = await prisma.studyGroupMember.findUnique({ where: { classId_userId: { classId, userId: targetId } } });
    if (existing) throw new ConflictError('Sinh viên đã thuộc một nhóm trong lớp');
    return prisma.$transaction(async (tx) => {
      const membership = await tx.studyGroupMember.create({ data: { groupId, classId, userId: targetId } });
      const projects = await tx.project.findMany({ where: { groupId, deletedAt: null }, select: { id: true } });
      for (const project of projects) {
        await tx.projectMember.upsert({
          where: { projectId_userId: { projectId: project.id, userId: targetId } },
          create: { projectId: project.id, userId: targetId, role: 'MEMBER', status: 'ACCEPTED' },
          update: { role: 'MEMBER', status: 'ACCEPTED' }
        });
      }
      return membership;
    });
  }

  async removeGroupMember(classId: string, groupId: string, userId: string, targetId: string) {
    const access = await this.groupAccess(classId, groupId, userId);
    if (!classroomPermissions({ isTeacher: access.isTeacher, classRole: access.memberRole, isLeader: access.isLeader }).manageGroup) {
      throw new ForbiddenError('Bạn không có quyền quản lý nhóm');
    }
    if (access.group.leaderId === targetId) throw new ConflictError('Hãy chuyển vai trò trưởng nhóm trước khi xóa');
    await prisma.$transaction(async (tx) => {
      const result = await tx.studyGroupMember.deleteMany({ where: { groupId, userId: targetId } });
      if (!result.count) throw new NotFoundError('Sinh viên không thuộc nhóm');
      const projects = await tx.project.findMany({ where: { groupId }, select: { id: true } });
      const projectIds = projects.map((p) => p.id);
      await tx.taskAssignee.deleteMany({ where: { userId: targetId, task: { projectId: { in: projectIds } } } });
      await tx.projectMember.deleteMany({ where: { userId: targetId, projectId: { in: projectIds } } });
    });
  }

  async setLeader(classId: string, groupId: string, userId: string, targetId: string) {
    const access = await this.groupAccess(classId, groupId, userId);
    if (!access.isManager) throw new ForbiddenError('Chỉ quản lý lớp được đổi trưởng nhóm');
    const member = await prisma.studyGroupMember.findUnique({ where: { groupId_userId: { groupId, userId: targetId } } });
    if (!member) throw new ValidationError('Trưởng nhóm mới phải thuộc nhóm này');
    await prisma.$transaction(async (tx) => {
      await tx.studyGroup.update({ where: { id: groupId }, data: { leaderId: targetId } });
      const projects = await tx.project.findMany({ where: { groupId }, select: { id: true } });
      for (const project of projects) {
        await tx.projectMember.updateMany({ where: { projectId: project.id, userId: access.group.leaderId }, data: { role: 'MEMBER' } });
        await tx.projectMember.updateMany({ where: { projectId: project.id, userId: targetId }, data: { role: 'OWNER' } });
        await tx.project.update({ where: { id: project.id }, data: { userId: targetId } });
      }
    });
  }

  async createProject(classId: string, groupId: string, userId: string, data: { name: string; description?: string; dueDate?: string }) {
    const access = await this.groupAccess(classId, groupId, userId);
    if (!classroomPermissions({ isTeacher: access.isTeacher, classRole: access.memberRole, isLeader: access.isLeader }).manageProject) {
      throw new ForbiddenError('Chỉ quản lý lớp hoặc trưởng nhóm được lập dự án nhóm');
    }
    const members = await prisma.studyGroupMember.findMany({ where: { groupId }, select: { userId: true } });
    return prisma.project.create({
      data: {
        userId: access.group.leaderId,
        classId,
        groupId,
        name: data.name,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        members: { create: members.map((m) => ({ userId: m.userId, role: (m.userId === access.group.leaderId ? 'OWNER' : 'MEMBER') as ProjectMemberRole, status: 'ACCEPTED' as const })) }
      }
    });
  }

  async updateProject(classId: string, projectId: string, userId: string, data: { name?: string; description?: string | null; dueDate?: string | null; status?: 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED' }) {
    const access = await this.projectAccess(classId, projectId, userId);
    if (!classroomPermissions({ isTeacher: access.isTeacher, classRole: access.memberRole, isLeader: access.isLeader }).manageProject) {
      throw new ForbiddenError('Chỉ quản lý lớp hoặc trưởng nhóm được sửa dự án');
    }
    return prisma.project.update({ where: { id: projectId }, data: { ...data, dueDate: data.dueDate === undefined ? undefined : data.dueDate ? new Date(data.dueDate) : null } });
  }

  async deleteProject(classId: string, projectId: string, userId: string) {
    const access = await this.projectAccess(classId, projectId, userId);
    if (!access.isTeacher) throw new ForbiddenError('Chỉ giảng viên được xóa dự án lớp học');
    await prisma.project.update({ where: { id: projectId }, data: { deletedAt: new Date() } });
  }

  async listReports(classId: string, projectId: string, userId: string) {
    await this.projectAccess(classId, projectId, userId);
    return prisma.progressReport.findMany({
      where: { projectId },
      include: { submittedBy: { select: publicUser }, reviewedBy: { select: publicUser } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async submitReport(classId: string, projectId: string, userId: string, data: { progressPercent: number; summary: string; blockers?: string }) {
    const access = await this.projectAccess(classId, projectId, userId);
    if (!classroomPermissions({ isTeacher: access.isTeacher, classRole: access.memberRole, isGroupMember: access.isGroupMember }).submitReport) {
      throw new ForbiddenError('Chỉ thành viên nhóm được báo cáo tiến độ');
    }
    return prisma.progressReport.create({ data: { projectId, submittedById: userId, ...data } });
  }

  async reviewReport(classId: string, projectId: string, reportId: string, userId: string, data: { reviewScore: number; reviewComment: string }) {
    const access = await this.projectAccess(classId, projectId, userId);
    if (!classroomPermissions({ isTeacher: access.isTeacher, classRole: access.memberRole }).reviewReport) {
      throw new ForbiddenError('Chỉ giảng viên được đánh giá tiến độ');
    }
    const result = await prisma.progressReport.updateMany({
      where: { id: reportId, projectId },
      data: { ...data, reviewedById: userId, reviewedAt: new Date() }
    });
    if (!result.count) throw new NotFoundError('Không tìm thấy báo cáo tiến độ');
    return prisma.progressReport.findUniqueOrThrow({ where: { id: reportId } });
  }

  async grantTeacher(adminId: string, email: string) {
    const admin = await prisma.user.findFirst({ where: { id: adminId, role: UserRole.ADMIN, deletedAt: null, status: 'ACTIVE' } });
    if (!admin) throw new ForbiddenError('Chỉ quản trị viên hệ thống được cấp vai trò giảng viên');
    const user = await prisma.user.findFirst({ where: { email: email.toLowerCase(), deletedAt: null } });
    if (!user) throw new NotFoundError('Không tìm thấy tài khoản');
    if (user.role === UserRole.ADMIN) throw new ValidationError('Không thể đổi vai trò quản trị viên hệ thống');
    return prisma.user.update({ where: { id: user.id }, data: { role: UserRole.TEACHER }, select: publicUser });
  }
}
