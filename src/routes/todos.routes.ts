import { Router } from 'express';
import { requireAuth } from './middleware/auth.middleware.js';
import * as todosController from '../controllers/todos.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/', todosController.getTodos);
router.post('/', todosController.createTodo);
router.delete('/:id', todosController.deleteTodo);
router.patch('/:id', todosController.updateTodo);
router.patch('/:id/complete', todosController.toggleComplete);
router.patch('/:id/reorder', todosController.reorderTodo);

export default router;
