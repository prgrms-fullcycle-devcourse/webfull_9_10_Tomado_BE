import { Request, Response, NextFunction } from 'express';
import * as statsService from '../services/stats.service.js';

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

// GET /stats/overview - 누적 기록
export const getOverallStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await statsService.getOverallStats(res.locals.authUserId as string);
        res.status(200).json(result);
    } catch (err: any) {
        handleError(err, res);
    }
};

// GET /stats/hetmap-summary
export const getHeatmapSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await statsService.getHeatmapSummary(res.locals.authUserId as string);
        res.status(200).json(result);
    } catch (err: any) {
        handleError(err, res);
    }
};

// GET /stats/heatmap
export const getHeatmap = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await statsService.getHeatmap(res.locals.authUserId as string);
        res.status(200).json(result);
    } catch (err: any) {
        handleError(err, res);
    }
};

// GET /stats/calendar
export const getCalendar = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { year, month } = req.query as Record<string, string>;

        if (!year || !month) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'year, month는 필수입니다.',
                },
            });
        }

        const result = await statsService.getCalendar(res.locals.authUserId as string, Number(year), Number(month));
        res.status(200).json(result);
    } catch (err: any) {
        handleError(err, res);
    }
};
