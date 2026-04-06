import { Router } from 'express';

import * as retroLogsController from '../controllers/retroLogs.controller.js';
import { requireAuth } from './middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth);

router.get('/list', retroLogsController.listRetros);
router.get('/search', retroLogsController.searchRetros);
router.get('/', retroLogsController.getRetro);
router.post('/', retroLogsController.createRetro);
router.patch('/:id', retroLogsController.updateRetro);
router.delete('/:id', retroLogsController.deleteRetro);

export default router;
