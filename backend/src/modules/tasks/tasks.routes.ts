import { Router } from 'express';
import { TasksController } from './tasks.controller';
import { asyncBoundary } from '../../shared/middleware/asyncBoundary';
import { authGuard } from '../../shared/middleware/authGuard';

const router = Router();
const controller = new TasksController();

router.use(authGuard);

router.get('/', asyncBoundary(controller.getTasks));
router.get('/:id', asyncBoundary(controller.getTaskById));
router.post('/', asyncBoundary(controller.createTask));
router.put('/:id', asyncBoundary(controller.updateTask));
router.delete('/:id', asyncBoundary(controller.deleteTask));
router.patch('/:id/status', asyncBoundary(controller.updateStatus));

export const tasksRouter = router;
