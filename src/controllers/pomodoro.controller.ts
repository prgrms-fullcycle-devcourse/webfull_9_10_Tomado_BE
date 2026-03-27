import { Request, Response, NextFunction } from 'express';
import * as pomodoroService from '../services/pomodoro.service.js';

const statusMap: Record<string, number> = {
    VALIDATION_ERROR: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
};

const handleError = (err: any, res: Response) => {
    const code = err.code ?? 'INTERNAL_ERROR';
    const status = statusMap[code] ?? 500;
    res.status(status).json({
        error: {
            code,
            message: err.message,
            ...(err.field !== undefined && { field: err.field }),
        },
    });
};

// POST /pomodoro/sessions
export const createSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.body;

        if (!type) {
            return res.status(400).json({
                error: { code: 'VALIDATION_ERROR', message: 'type은 필수 입니다.', field: 'type' },
            });
        }

        const session = await pomodoroService.createSession(res.locals.authUserId as string, {
            type,
        });
        res.status(201).json(session);
    } catch (err: any) {
        handleError(err, res);
    }
};

// PATCH /pomodoro/sessions/:id/end
export const endSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status, actual_sec, ended_at } = req.body;

        if (!status || actual_sec === undefined || !ended_at) {
            return res.status(400).json({
                error: { code: 'VALIDATION_ERROR', message: 'status, actual_sec, ended_at은 필수입니다' },
            });
        }

        const session = await pomodoroService.endSession(res.locals.authUserId as string, req.params.id as string, {
            status,
            actual_sec,
            ended_at,
        });
        res.status(200).json(session);
    } catch (err: any) {
        handleError(err, res);
    }
};

// GET /pomodoro/sessions
export const getSessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { start_date, end_date, type } = req.query as Record<string, string>;

        if (!start_date || !end_date) {
            return res.status(400).json({
                error: { code: 'VALIDATION_ERROR', message: 'start_date, end_date는 필수입니다.' },
            });
        }

        const sessions = await pomodoroService.getSessions(res.locals.authUserId as string, start_date, end_date, type);
        res.status(200).json(sessions);
    } catch (err: any) {
        handleError(err, res);
    }
};
