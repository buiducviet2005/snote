import { Router } from 'express';
import { NotesController } from './notes.controller';

const router = Router();
const controller = new NotesController();

router.get('/', controller.listNotes);
router.post('/', controller.createNote);

export const notesRouter = router;
