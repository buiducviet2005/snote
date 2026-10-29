import { Router } from 'express';
import { authGuard } from '../../shared/middleware/authGuard';
import { asyncBoundary } from '../../shared/middleware/asyncBoundary';
import { WorkspacesController } from './workspaces.controller';

const router = Router();
const controller = new WorkspacesController();

router.use(authGuard);
router.get('/', asyncBoundary(controller.list));
router.post('/', asyncBoundary(controller.create));
router.post('/join', asyncBoundary(controller.join));
router.get('/invitations', asyncBoundary(controller.listInvitations));
router.post('/invitations/:memberId/accept', asyncBoundary(controller.acceptInvitation));
router.post('/invitations/:memberId/decline', asyncBoundary(controller.declineInvitation));
router.get('/:workspaceId/context', asyncBoundary(controller.context));
router.get('/:workspaceId/progress', asyncBoundary(controller.progress));
router.get('/:workspaceId/members', asyncBoundary(controller.members));
router.post('/:workspaceId/members', asyncBoundary(controller.addMember));
router.patch('/:workspaceId/members/:memberId', asyncBoundary(controller.updateMemberRole));
router.delete('/:workspaceId/members/:memberId', asyncBoundary(controller.removeMember));

export const workspacesRouter = router;
