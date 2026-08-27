import { Router } from 'express';
import { NotesController } from './notes.controller';
import { asyncBoundary } from '../../shared/middleware/asyncBoundary';
import { optionalAuthGuard } from '../../shared/middleware/authGuard';

const router = Router();
const controller = new NotesController();

// Áp dụng auth guard và async boundary cho toàn bộ routes
router.use(optionalAuthGuard);

router.get('/', asyncBoundary(controller.listNotes));
router.post('/', asyncBoundary(controller.createNote));
router.get('/:id', asyncBoundary(controller.getNoteById));

export const notesRouter = router;
