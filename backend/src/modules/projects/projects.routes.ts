import { Router } from 'express';
import { ProjectsController } from './projects.controller';
import { asyncBoundary } from '../../shared/middleware/asyncBoundary';
import { authGuard } from '../../shared/middleware/authGuard';

const router = Router();
const controller = new ProjectsController();

router.use(authGuard);

router.get('/', asyncBoundary(controller.getAll));
router.get('/:id', asyncBoundary(controller.getById));
router.post('/', asyncBoundary(controller.create));
router.put('/:id', asyncBoundary(controller.update));
router.delete('/:id', asyncBoundary(controller.delete));

export const projectsRouter = router;
