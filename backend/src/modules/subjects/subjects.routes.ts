import { Router } from 'express';
import { SubjectsController } from './subjects.controller';
import { asyncBoundary } from '../../shared/middleware/asyncBoundary';
import { authGuard } from '../../shared/middleware/authGuard';

const router = Router();
const controller = new SubjectsController();

router.use(authGuard);

router.get('/', asyncBoundary(controller.getAll));
router.get('/:id', asyncBoundary(controller.getById));
router.post('/', asyncBoundary(controller.create));
router.put('/:id', asyncBoundary(controller.update));
router.delete('/:id', asyncBoundary(controller.delete));

export const subjectsRouter = router;
