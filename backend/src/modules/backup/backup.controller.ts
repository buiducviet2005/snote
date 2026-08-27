import { Request, Response } from 'express';
import { BackupService } from './backup.service';

export class BackupController {
  constructor(private readonly backupService: BackupService = new BackupService()) {}

  exportData = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { data, checksum } = await this.backupService.exportUserData(userId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="snote_backup_${userId}.json"`);
    res.setHeader('X-Checksum-SHA256', checksum);

    res.status(200).json({
      success: true,
      message: 'Xuất dữ liệu sao lưu thành công',
      checksum,
      data
    });
  };
}
