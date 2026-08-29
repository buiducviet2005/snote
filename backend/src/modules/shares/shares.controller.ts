import { Request, Response, NextFunction } from 'express';
import { SharesService } from './shares.service';
import { CreateShareDto } from './shares.types';

export class SharesController {
  constructor(private readonly service: SharesService = new SharesService()) {}

  createShare = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const dto: CreateShareDto = req.body;
      const share = await this.service.createShare(userId, dto);
      res.status(201).json({
        success: true,
        data: share,
        message: 'Tạo liên kết chia sẻ thành công'
      });
    } catch (err) {
      next(err);
    }
  };

  getSharedByMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const shares = await this.service.getSharedByMe(userId);
      res.json({
        success: true,
        data: shares
      });
    } catch (err) {
      next(err);
    }
  };

  getSharedWithMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const items = await this.service.getSharedWithMe(userId);
      res.json({
        success: true,
        data: items
      });
    } catch (err) {
      next(err);
    }
  };

  getPublicShare = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.params.token as string;
      const data = await this.service.getPublicShare(token);
      res.json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  };

  revokeShare = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const shareId = req.params.id as string;
      await this.service.revokeShare(userId, shareId);
      res.json({
        success: true,
        message: 'Đã thu hồi liên kết chia sẻ'
      });
    } catch (err) {
      next(err);
    }
  };
}
