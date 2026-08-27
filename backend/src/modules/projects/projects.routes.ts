import { Router } from 'express';
import { ProjectsController } from './projects.controller';
import { authGuard } from '../../shared/middleware/authGuard';
import { asyncBoundary } from '../../shared/middleware/asyncBoundary';

const router = Router();
const controller = new ProjectsController();

router.use(authGuard);

router.get('/', asyncBoundary(controller.getAll));
router.get('/:id', asyncBoundary(controller.getById));
router.get('/:id/workspace', asyncBoundary(controller.getWorkspace));
router.post('/', asyncBoundary(controller.create));
router.put('/:id', asyncBoundary(controller.update));
router.delete('/:id', asyncBoundary(controller.delete));

// Team collaboration routes
router.post('/:id/members', asyncBoundary(controller.addMember));
router.put('/:id/members/:memberUserId', asyncBoundary(controller.updateMemberRole));
router.delete('/:id/members/:memberUserId', asyncBoundary(controller.removeMember));

export const projectsRouter = router;
