import type { NextFunction, Request, Response } from 'express';

import * as retroLogsService from '../services/retroLogs.service.js';

const statusMap: Record<string, number> = {
    VALIDATION_ERROR: 400,
    NOT_FOUND: 404,
    FORBIDDEN: 403,
    CONFLICT: 409,
};

function sendServiceError(res: Response, err: unknown): boolean {
    const e = err as Error & { code?: string; field?: string };
    if (e.code == null || statusMap[e.code] == null) {
        return false;
    }
    const status = statusMap[e.code]!;
    const body: {
        error: { code: string; message: string; field?: string };
    } = {
        error: {
            code: e.code,
            message: e.message,
        },
    };
    if (e.field !== undefined) {
        body.error.field = e.field;
    }
    res.status(status).json(body);
    return true;
}

export const getRetro = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const date = typeof req.query.date === 'string' ? req.query.date : undefined;
        const daily_log_id = typeof req.query.daily_log_id === 'string' ? req.query.daily_log_id : undefined;

        const result = await retroLogsService.getRetro(res.locals.authUserId as string, {
            date,
            daily_log_id,
        });
        res.status(200).json(result);
    } catch (err) {
        if (sendServiceError(res, err)) return;
        next(err);
    }
};

export const createRetro = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await retroLogsService.createRetro(res.locals.authUserId as string, req.body);
        res.status(201).json(result);
    } catch (err) {
        if (sendServiceError(res, err)) return;
        next(err);
    }
};

export const searchRetros = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
        if (q === '') {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: '검색어(q)는 필수입니다.',
                    field: 'q',
                },
            });
        }

        const result = await retroLogsService.searchRetros(res.locals.authUserId as string, q);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

export const listRetros = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = typeof req.query.page === 'string' ? Number(req.query.page) : undefined;
        const page_size = typeof req.query.page_size === 'string' ? Number(req.query.page_size) : undefined;
        const result = await retroLogsService.listRetros(res.locals.authUserId as string, { page, page_size });
        res.status(200).json(result);
    } catch (err) {
        if (sendServiceError(res, err)) return;
        next(err);
    }
};

export const updateRetro = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await retroLogsService.updateRetro(res.locals.authUserId as string, req.params.id as string, {
            content: req.body?.content,
            is_dirty: req.body?.is_dirty,
            draft_content: req.body?.draft_content,
        });
        res.status(200).json(result);
    } catch (err) {
        if (sendServiceError(res, err)) return;
        next(err);
    }
};

export const deleteRetro = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await retroLogsService.deleteRetro(res.locals.authUserId as string, req.params.id as string);
        res.status(204).send();
    } catch (err) {
        if (sendServiceError(res, err)) return;
        next(err);
    }
};
