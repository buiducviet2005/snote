import { Router } from 'express';
import { authGuard } from '../../shared/middleware/authGuard';
import { asyncBoundary } from '../../shared/middleware/asyncBoundary';
import { WorkspacesController } from './workspaces.controller';

const router = Router();
const controller = new WorkspacesController();

router.use(authGuard);
router.get('/', asyncBoundary(controller.list));
router.post('/', asyncBoundary(controller.create));
router.get('/:workspaceId/context', asyncBoundary(controller.context));
router.get('/:workspaceId/members', asyncBoundary(controller.members));

export const workspacesRouter = router;
