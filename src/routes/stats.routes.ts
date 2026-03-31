import { Router } from 'express';
import { requireAuth } from './middleware/auth.middleware.js';
import * as statsController from '../controllers/stats.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/overview', statsController.getOverallStats);
router.get('/heatmap-summary', statsController.getHeatmapSummary);
router.get('/heatmap', statsController.getHeatmap);
router.get('/calendar', statsController.getCalendar);

export default router;
