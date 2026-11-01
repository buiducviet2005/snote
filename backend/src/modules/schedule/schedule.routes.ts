import { Router } from 'express';
import { ScheduleController } from './schedule.controller';
import { asyncBoundary } from '../../shared/middleware/asyncBoundary';
import { authGuard } from '../../shared/middleware/authGuard';

const router = Router();
const controller = new ScheduleController();

router.use(authGuard);

router.get('/', asyncBoundary(controller.getEvents));
router.get('/upcoming', asyncBoundary(controller.getEvents));
router.get('/events', asyncBoundary(controller.getEvents));
router.get('/events/:id', asyncBoundary(controller.getById));
router.get('/:id', asyncBoundary(controller.getById));

router.post('/', asyncBoundary(controller.create));
router.post('/events', asyncBoundary(controller.create));

router.put('/events/:id', asyncBoundary(controller.update));
router.put('/:id', asyncBoundary(controller.update));

router.delete('/events/:id', asyncBoundary(controller.delete));
router.delete('/:id', asyncBoundary(controller.delete));

export const scheduleRouter = router;
