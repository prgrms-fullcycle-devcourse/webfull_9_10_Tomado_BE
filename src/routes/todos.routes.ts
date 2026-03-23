import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as todosController from '../controllers/todos.controller.js';

const router = Router();
router.use(authMiddleware);
router.get('/', todosController.getTodos);
router.post('/', todosController.createTodo);
router.delete('/:id', todosController.deleteTodo);
router.patch('/:id', todosController.updateTodo);

export default router;
