import { Request, Response } from 'express';
import { z } from 'zod';
import * as usersService from '../services/users.service.js';

// GET /users/me — 내 프로필 조회
export async function getMe(req: Request, res: Response) {
    try {
        const userId = res.locals.authUserId;
        const user = await usersService.getMyProfile(userId);
        res.status(200).json(user);
    } catch (error) {
        if (error instanceof Error && error.message === 'NOT_FOUND') {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: '유저를 찾을 수 없습니다.' } });
            return;
        }
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } });
    }
}

// PATCH /users/me — 내 프로필 수정
const patchMeSchema = z.object({
    nickname: z.string().optional(),
    avatar_url: z.string().url().optional(),
});

export async function patchMe(req: Request, res: Response) {
    const parsed = patchMeSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({
            error: { code: 'VALIDATION_ERROR', message: parsed.error?.errors[0]?.message ?? '유효성 검사 실패' },
        });
        return;
    }

    try {
        const userId = res.locals.authUserId;
        const user = await usersService.updateMyProfile(userId, parsed.data);
        res.status(200).json(user);
    } catch (error) {
        if (error instanceof Error && error.message === 'NOT_FOUND') {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: '유저를 찾을 수 없습니다.' } });
            return;
        }
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } });
    }
}

export async function uploadAvatar(req: Request, res: Response) {
    const file = req.file;

    if (!file) {
        res.status(400).json({
            error: { code: 'VALIDATION_ERROR', message: 'avatar 파일이 필요합니다.' },
        });
        return;
    }

    if (!file.mimetype.startsWith('image/')) {
        res.status(400).json({
            error: { code: 'VALIDATION_ERROR', message: '이미지 파일만 업로드할 수 있습니다.' },
        });
        return;
    }

    try {
        const userId = res.locals.authUserId;
        const user = await usersService.uploadMyAvatar(userId, file);
        res.status(200).json(user);
    } catch (error) {
        if (error instanceof Error && error.message === 'NOT_FOUND') {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: '유저를 찾을 수 없습니다.' } });
            return;
        }
        console.error(error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } });
    }
}

export async function deleteAvatar(req: Request, res: Response) {
    try {
        const userId = res.locals.authUserId;
        const user = await usersService.deleteMyAvatar(userId);
        res.status(200).json(user);
    } catch (error) {
        if (error instanceof Error && error.message === 'NOT_FOUND') {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: '유저를 찾을 수 없습니다.' } });
            return;
        }
        console.error(error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } });
    }
}

// GET /users/me/settings — 내 앱 설정 조회
export async function getSettings(req: Request, res: Response) {
    try {
        const userId = res.locals.authUserId;
        const settings = await usersService.getMySettings(userId);
        res.status(200).json(settings);
    } catch (error) {
        if (error instanceof Error && error.message === 'NOT_FOUND') {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: '설정을 찾을 수 없습니다.' } });
            return;
        }
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } });
    }
}

// PATCH /users/me/settings — 내 앱 설정 수정
const patchSettingsSchema = z.object({
    focus_min: z.number().int().positive().optional(),
    short_break_min: z.number().int().positive().optional(),
    long_break_min: z.number().int().positive().optional(),
    sessions_per_set: z.number().int().positive().optional(),
    auto_carry_todo: z.boolean().optional(),
});

export async function patchSettings(req: Request, res: Response) {
    const parsed = patchSettingsSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({
            error: { code: 'VALIDATION_ERROR', message: parsed.error?.errors[0]?.message ?? '유효성 검사 실패' },
        });
        return;
    }

    try {
        const userId = res.locals.authUserId;
        const settings = await usersService.updateMySettings(userId, parsed.data);
        res.status(200).json(settings);
    } catch (error) {
        if (error instanceof Error && error.message === 'NOT_FOUND') {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: '설정을 찾을 수 없습니다.' } });
            return;
        }
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } });
    }
}

// DELETE /users/me — 회원 탈퇴
export async function deleteMe(req: Request, res: Response) {
    try {
        const userId = res.locals.authUserId;
        await usersService.deleteMyAccount(userId);
        res.status(204).send();
    } catch (error) {
        if (error instanceof Error && error.message === 'NOT_FOUND') {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: '유저를 찾을 수 없습니다.' } });
            return;
        }
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } });
    }
}
