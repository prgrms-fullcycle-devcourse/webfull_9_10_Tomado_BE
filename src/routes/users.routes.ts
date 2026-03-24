import { Router } from 'express';
import * as usersController from '../controllers/users.controller.js';
import { requireAuth } from './middleware/auth.middleware.js';

const router = Router();

// 모든 사용자 라우트에 인증 미들웨어 적용
router.use(requireAuth);

// GET /users/me — 내 프로필 조회
router.get('/me', usersController.getMe);

// PATCH /users/me — 내 프로필 수정
router.patch('/me', usersController.patchMe);

// GET /users/me/settings — 내 앱 설정 조회
router.get('/me/settings', usersController.getSettings);

// PATCH /users/me/settings — 내 앱 설정 수정
router.patch('/me/settings', usersController.patchSettings);

// DELETE /users/me — 회원 탈퇴
router.delete('/me', usersController.deleteMe);

export default router;
