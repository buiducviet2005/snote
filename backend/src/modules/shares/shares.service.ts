import crypto from 'crypto';
import { prisma } from '../../shared/db/prismaClient';
import { CreateShareDto, ShareResponseDto } from './shares.types';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../shared/errors/appErrors';
import { ShareTargetType, ShareAccessLevel } from '@prisma/client';

export class SharesService {
  /**
   * Tạo lượt chia sẻ mới hoặc tạo Public Link
   */
  async createShare(userId: string, dto: CreateShareDto): Promise<ShareResponseDto> {
    // 1. Kiểm tra quyền sở hữu đối với tài nguyên
    let targetTitle = '';
    if (dto.targetType === ShareTargetType.NOTE) {
      const note = await prisma.note.findFirst({
        where: { id: dto.targetId, userId, deletedAt: null }
      });
      if (!note) throw new NotFoundError('Không tìm thấy ghi chú hoặc bạn không có quyền chia sẻ');
      targetTitle = note.title;
    } else if (dto.targetType === ShareTargetType.TASK) {
      const task = await prisma.task.findFirst({
        where: { id: dto.targetId, userId, deletedAt: null }
      });
      if (!task) throw new NotFoundError('Không tìm thấy công việc hoặc bạn không có quyền chia sẻ');
      targetTitle = task.title;
    } else if (dto.targetType === ShareTargetType.PROJECT) {
      const project = await prisma.project.findFirst({
        where: { id: dto.targetId, userId, deletedAt: null }
      });
      if (!project) throw new NotFoundError('Không tìm thấy đồ án hoặc bạn không có quyền chia sẻ');
      targetTitle = project.name;
    }

    // 2. Phân giải người nhận nếu có email
    let sharedWithUserId: string | null = null;
    if (dto.sharedWithEmail) {
      const recipient = await prisma.user.findUnique({
        where: { email: dto.sharedWithEmail.trim().toLowerCase() }
      });
      if (recipient) {
        if (recipient.id === userId) {
          throw new BadRequestError('Bạn không thể chia sẻ tài liệu cho chính mình');
        }
        sharedWithUserId = recipient.id;
      }
    }

    // 3. Tạo token ngẫu nhiên nếu là public link
    const shareToken = dto.isPublic ? crypto.randomBytes(24).toString('hex') : null;

    // 4. Tính toán thời gian hết hạn nếu có
    const expiresAt = dto.expiresInDays
      ? new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const share = await prisma.resourceShare.create({
      data: {
        ownerId: userId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        sharedWithUserId,
        sharedWithEmail: dto.sharedWithEmail ? dto.sharedWithEmail.trim().toLowerCase() : null,
        accessLevel: dto.accessLevel || ShareAccessLevel.VIEW,
        shareToken,
        isPublic: Boolean(dto.isPublic),
        expiresAt
      },
      include: {
        owner: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        sharedWithUser: { select: { id: true, fullName: true, email: true, avatarUrl: true } }
      }
    });

    return {
      ...share,
      targetTitle
    };
  }

  /**
   * Lấy danh sách tài liệu do tôi chia sẻ
   */
  async getSharedByMe(userId: string): Promise<ShareResponseDto[]> {
    const shares = await prisma.resourceShare.findMany({
      where: { ownerId: userId },
      include: {
        owner: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        sharedWithUser: { select: { id: true, fullName: true, email: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return shares;
  }

  /**
   * Lấy danh sách tài liệu người khác chia sẻ cho tôi
   */
  async getSharedWithMe(userId: string): Promise<any[]> {
    const shares = await prisma.resourceShare.findMany({
      where: {
        sharedWithUserId: userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      },
      include: {
        owner: { select: { id: true, fullName: true, email: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Resolve target items details
    const result: any[] = [];
    for (const s of shares) {
      let targetItem: any = null;
      if (s.targetType === ShareTargetType.NOTE) {
        targetItem = await prisma.note.findFirst({
          where: { id: s.targetId, deletedAt: null },
          include: {
            subject: { select: { id: true, name: true, code: true, color: true } },
            noteTags: { include: { tag: true } }
          }
        });
      } else if (s.targetType === ShareTargetType.TASK) {
        targetItem = await prisma.task.findFirst({
          where: { id: s.targetId, deletedAt: null },
          include: {
            subject: { select: { id: true, name: true, code: true, color: true } }
          }
        });
      } else if (s.targetType === ShareTargetType.PROJECT) {
        targetItem = await prisma.project.findFirst({
          where: { id: s.targetId, deletedAt: null },
          include: {
            subject: { select: { id: true, name: true, code: true, color: true } }
          }
        });
      }

      if (targetItem) {
        result.push({
          shareId: s.id,
          accessLevel: s.accessLevel,
          targetType: s.targetType,
          targetId: s.targetId,
          sharedAt: s.createdAt,
          owner: s.owner,
          targetItem
        });
      }
    }

    return result;
  }

  /**
   * Truy cập tài liệu chia sẻ công khai qua Token
   */
  async getPublicShare(token: string): Promise<any> {
    const share = await prisma.resourceShare.findUnique({
      where: { shareToken: token },
      include: {
        owner: { select: { id: true, fullName: true, email: true, avatarUrl: true } }
      }
    });

    if (!share || !share.isPublic) {
      throw new NotFoundError('Liên kết chia sẻ không tồn tại hoặc đã bị vô hiệu hóa');
    }

    if (share.expiresAt && share.expiresAt < new Date()) {
      throw new ForbiddenError('Liên kết chia sẻ này đã hết hạn');
    }

    let targetItem: any = null;
    if (share.targetType === ShareTargetType.NOTE) {
      targetItem = await prisma.note.findFirst({
        where: { id: share.targetId, deletedAt: null },
        include: {
          subject: { select: { id: true, name: true, code: true, color: true } },
          noteTags: { include: { tag: true } }
        }
      });
    } else if (share.targetType === ShareTargetType.TASK) {
      targetItem = await prisma.task.findFirst({
        where: { id: share.targetId, deletedAt: null },
        include: {
          subject: { select: { id: true, name: true, code: true, color: true } }
        }
      });
    }

    if (!targetItem) {
      throw new NotFoundError('Nội dung chia sẻ đã bị xóa hoặc không còn khả dụng');
    }

    return {
      shareId: share.id,
      accessLevel: share.accessLevel,
      targetType: share.targetType,
      owner: share.owner,
      targetItem
    };
  }

  /**
   * Thu hồi quyền chia sẻ
   */
  async revokeShare(userId: string, shareId: string): Promise<void> {
    const share = await prisma.resourceShare.findFirst({
      where: { id: shareId, ownerId: userId }
    });

    if (!share) {
      throw new NotFoundError('Không tìm thấy liên kết chia sẻ hoặc bạn không có quyền thu hồi');
    }

    await prisma.resourceShare.delete({
      where: { id: shareId }
    });
  }
}
