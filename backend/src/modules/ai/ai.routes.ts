import { Router } from 'express';
import { AiController } from './ai.controller';
import { authGuard } from '../../shared/middleware/authGuard';
import { asyncBoundary } from '../../shared/middleware/asyncBoundary';

const router = Router();
const controller = new AiController();

router.post('/chat', authGuard, asyncBoundary(controller.chat));

export const aiRouter = router;
