import { Router } from 'express';
import { BackupController } from './backup.controller';
import { asyncBoundary } from '../../shared/middleware/asyncBoundary';
import { authGuard } from '../../shared/middleware/authGuard';

const router = Router();
const controller = new BackupController();

router.use(authGuard);

router.get('/export', asyncBoundary(controller.exportData));
router.get('/export-markdown', asyncBoundary(controller.exportMarkdown));
router.post('/restore', asyncBoundary(controller.restoreData));

export const backupRouter = router;
