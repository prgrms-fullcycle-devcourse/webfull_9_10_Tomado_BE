import { Router } from 'express';

import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from './middleware/auth.middleware.js';

export const authRouter = Router();

authRouter.get('/login-id/check', authController.checkLoginId);
authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', requireAuth, authController.logout);
