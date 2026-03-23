import type { Request, Response } from 'express';

import { AuthHttpError } from '../lib/authErrors.js';
import * as authService from '../services/auth.service.js';

function sendAuthError(res: Response, err: AuthHttpError) {
    res.status(err.status).json({
        error: {
            code: err.code,
            message: err.message,
            ...(err.field != null ? { field: err.field } : {}),
        },
    });
}

export async function register(req: Request, res: Response) {
    try {
        const result = await authService.register(req.body);
        res.status(result.status).json(result.body);
    } catch (e) {
        if (e instanceof AuthHttpError) {
            sendAuthError(res, e);
            return;
        }
        console.error(e);
        res.status(500).json({
            error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' },
        });
    }
}

export async function login(req: Request, res: Response) {
    try {
        const result = await authService.login(req.body);
        res.status(result.status).json(result.body);
    } catch (e) {
        if (e instanceof AuthHttpError) {
            sendAuthError(res, e);
            return;
        }
        console.error(e);
        res.status(500).json({
            error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' },
        });
    }
}

export async function refresh(req: Request, res: Response) {
    try {
        const result = await authService.refresh(req.body);
        res.status(result.status).json(result.body);
    } catch (e) {
        if (e instanceof AuthHttpError) {
            sendAuthError(res, e);
            return;
        }
        console.error(e);
        res.status(500).json({
            error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' },
        });
    }
}

export async function logout(req: Request, res: Response) {
    try {
        const accessToken = res.locals.authAccessToken as string | undefined;
        if (accessToken == null) {
            sendAuthError(res, new AuthHttpError(401, 'UNAUTHORIZED', '유효하지 않거나 만료된 Access Token입니다.'));
            return;
        }
        const result = await authService.logout(accessToken);
        res.status(result.status).end();
    } catch (e) {
        if (e instanceof AuthHttpError) {
            sendAuthError(res, e);
            return;
        }
        console.error(e);
        res.status(500).json({
            error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' },
        });
    }
}
