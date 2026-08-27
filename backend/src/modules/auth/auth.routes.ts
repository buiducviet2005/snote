import { Router } from 'express';
import { AuthController } from './auth.controller';
import { asyncBoundary } from '../../shared/middleware/asyncBoundary';
import { authGuard } from '../../shared/middleware/authGuard';
import { loginRateLimiter } from '../../shared/middleware/rateLimit';

const router = Router();
const controller = new AuthController();

// Public routes
router.post('/register', loginRateLimiter, asyncBoundary(controller.register));
router.post('/login', loginRateLimiter, asyncBoundary(controller.login));
router.post('/refresh', asyncBoundary(controller.refresh));
router.post('/logout', asyncBoundary(controller.logout));

// Protected routes (Anti-IDOR with authGuard)
router.get('/me', authGuard, asyncBoundary(controller.me));

export const authRouter = router;
