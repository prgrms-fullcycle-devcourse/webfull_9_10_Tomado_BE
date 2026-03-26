import { Router } from 'express';
import { requireAuth } from './middleware/auth.middleware.js';
import * as pomodoroController from '../controllers/pomodoro.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/sessions', pomodoroController.createSession);
router.patch('/sessions/:id/end', pomodoroController.endSession);
router.get('/sessions', pomodoroController.getSessions);

export default router;
