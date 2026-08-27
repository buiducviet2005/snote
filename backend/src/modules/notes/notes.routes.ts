import { Router } from 'express';
import { NotesController } from './notes.controller';
import { asyncBoundary } from '../../shared/middleware/asyncBoundary';
import { authGuard } from '../../shared/middleware/authGuard';

const router = Router();
const controller = new NotesController();

// Mọi routes ghi chú đều được bảo vệ bởi authGuard (Anti-IDOR)
router.use(authGuard);

router.get('/', asyncBoundary(controller.getNotes));
router.get('/:id', asyncBoundary(controller.getNoteById));
router.post('/', asyncBoundary(controller.createNote));
router.put('/:id', asyncBoundary(controller.updateNote));
router.delete('/:id', asyncBoundary(controller.deleteNote));
router.patch('/:id/pin', asyncBoundary(controller.togglePin));
router.patch('/:id/archive', asyncBoundary(controller.toggleArchive));

export const notesRouter = router;
