import { Router } from 'express';
import { SearchController } from './search.controller';
import { authGuard } from '../../shared/middleware/authGuard';
import { asyncBoundary } from '../../shared/middleware/asyncBoundary';

const router = Router();
const controller = new SearchController();

router.use(authGuard);
router.get('/', asyncBoundary(controller.search));

export { router as searchRouter };
