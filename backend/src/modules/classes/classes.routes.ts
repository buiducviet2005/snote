import { Router } from 'express';
import { authGuard } from '../../shared/middleware/authGuard';
import { asyncBoundary } from '../../shared/middleware/asyncBoundary';
import { ClassesController } from './classes.controller';

const router = Router();
const controller = new ClassesController();
router.use(authGuard);

router.get('/', asyncBoundary(controller.list));
router.post('/join', asyncBoundary(controller.joinClass));
router.post('/', asyncBoundary(controller.create));
router.post('/teachers', asyncBoundary(controller.grantTeacher));
router.get('/:id/overview', asyncBoundary(controller.overview));
router.get('/:id', asyncBoundary(controller.get));
router.put('/:id', asyncBoundary(controller.update));
router.post('/:id/members', asyncBoundary(controller.addMember));
router.put('/:id/members/:userId', asyncBoundary(controller.setMemberRole));
router.delete('/:id/members/:userId', asyncBoundary(controller.removeMember));
router.post('/:id/groups', asyncBoundary(controller.createGroup));
router.put('/:id/groups/:groupId', asyncBoundary(controller.updateGroup));
router.delete('/:id/groups/:groupId', asyncBoundary(controller.deleteGroup));
router.post('/:id/groups/:groupId/members', asyncBoundary(controller.addGroupMember));
router.delete('/:id/groups/:groupId/members/:userId', asyncBoundary(controller.removeGroupMember));
router.put('/:id/groups/:groupId/leader', asyncBoundary(controller.setLeader));
router.post('/:id/groups/:groupId/projects', asyncBoundary(controller.createProject));
router.put('/:id/projects/:projectId', asyncBoundary(controller.updateProject));
router.delete('/:id/projects/:projectId', asyncBoundary(controller.deleteProject));
router.get('/:id/projects/:projectId/reports', asyncBoundary(controller.listReports));
router.post('/:id/projects/:projectId/reports', asyncBoundary(controller.submitReport));
router.put('/:id/projects/:projectId/reports/:reportId/review', asyncBoundary(controller.reviewReport));

export const classesRouter = router;
