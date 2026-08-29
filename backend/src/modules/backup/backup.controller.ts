import { Request, Response, NextFunction } from 'express';
import { BackupService } from './backup.service';

export class BackupController {
  constructor(private readonly backupService: BackupService = new BackupService()) {}

  exportData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId || (req as any).user.id;
      const { semesterId, subjectId } = req.query;

      const { data, checksum } = await this.backupService.exportUserData(userId, {
        semesterId: semesterId as string,
        subjectId: subjectId as string
      });

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="snote_backup_${userId}.json"`);
      res.setHeader('X-Checksum-SHA256', checksum);

      res.status(200).json({
        success: true,
        message: 'Xuất dữ liệu sao lưu thành công',
        checksum,
        data
      });
    } catch (err) {
      next(err);
    }
  };

  exportMarkdown = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId || (req as any).user.id;
      const { semesterId, subjectId } = req.query;

      const items = await this.backupService.exportMarkdownNotes(userId, {
        semesterId: semesterId as string,
        subjectId: subjectId as string
      });

      res.status(200).json({
        success: true,
        message: `Xuất thành công ${items.length} tệp ghi chú Markdown`,
        data: items
      });
    } catch (err) {
      next(err);
    }
  };

  restoreData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId || (req as any).user.id;
      const { payload, mode } = req.body;

      const result = await this.backupService.restoreUserData(userId, payload, mode);

      res.status(200).json({
        success: true,
        message: 'Khôi phục dữ liệu thành công!',
        data: result
      });
    } catch (err) {
      next(err);
    }
  };
}
