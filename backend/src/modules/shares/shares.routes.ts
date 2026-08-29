import { Router } from 'express';
import { SharesController } from './shares.controller';
import { authGuard } from '../../shared/middleware/authGuard';
import { asyncBoundary } from '../../shared/middleware/asyncBoundary';

const router = Router();
const controller = new SharesController();

// Public share link (does not require login)
router.get('/public/:token', asyncBoundary(controller.getPublicShare));

// Authenticated endpoints
router.use(authGuard);
router.post('/', asyncBoundary(controller.createShare));
router.get('/shared-by-me', asyncBoundary(controller.getSharedByMe));
router.get('/shared-with-me', asyncBoundary(controller.getSharedWithMe));
router.delete('/:id', asyncBoundary(controller.revokeShare));

export { router as sharesRouter };
