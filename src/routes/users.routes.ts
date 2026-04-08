import { Router } from 'express';
import multer from 'multer';
import * as usersController from '../controllers/users.controller.js';
import { requireAuth } from './middleware/auth.middleware.js';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

// 모든 사용자 라우트에 인증 미들웨어 적용
router.use(requireAuth);

// GET /users/me — 내 프로필 조회
router.get('/me', usersController.getMe);

// PATCH /users/me — 내 프로필 수정
router.patch('/me', usersController.patchMe);

// POST /users/me/avatar — 내 프로필 이미지 업로드/교체
router.post('/me/avatar', upload.single('avatar'), usersController.uploadAvatar);

// DELETE /users/me/avatar — 내 프로필 이미지 삭제
router.delete('/me/avatar', usersController.deleteAvatar);

// GET /users/me/settings — 내 앱 설정 조회
router.get('/me/settings', usersController.getSettings);

// PATCH /users/me/settings — 내 앱 설정 수정
router.patch('/me/settings', usersController.patchSettings);

// DELETE /users/me — 회원 탈퇴
router.delete('/me', usersController.deleteMe);

export default router;
