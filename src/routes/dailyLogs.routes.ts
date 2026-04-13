import { Router } from 'express';
import { requireAuth } from './middleware/auth.middleware.js';
import * as dailyLogsController from '../controllers/dailyLogs.controller.js';

const router = Router();

// 모든 데일리 로그 API는 인증 필요
router.use(requireAuth);

router.get('/', dailyLogsController.getLogByDate);
router.post('/', dailyLogsController.createLog);
router.get('/list', dailyLogsController.getLogsInRange);
router.get('/all', dailyLogsController.getAllLogs);
router.get('/search', dailyLogsController.searchLogs);
router.patch('/:id', dailyLogsController.updateLog);
router.delete('/:id', dailyLogsController.deleteLog);

export default router;
