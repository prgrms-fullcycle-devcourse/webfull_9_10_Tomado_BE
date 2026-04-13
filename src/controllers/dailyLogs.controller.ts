import { Request, Response } from 'express';
import * as dailyLogsService from '../services/dailyLogs.service.js';

const handleError = (res: Response, e: any) => {
    const status = e.status || 500;
    const code = e.code || 'INTERNAL_SERVER_ERROR';
    return res.status(status).json({
        error: {
            code,
            message: e.message,
        },
    });
};

// 데일리 로그 생성
export const createLog = async (req: Request, res: Response) => {
    try {
        const userId = res.locals.authUserId;
        const { log_date, title, content, tags } = req.body;

        const log = await dailyLogsService.createLog(userId, {
            log_date,
            title,
            content,
            tags,
        });

        return res.status(201).json(log);
    } catch (e: any) {
        return handleError(res, e);
    }
};

// 특정 날짜 로그 조회
export const getLogByDate = async (req: Request, res: Response) => {
    try {
        const userId = res.locals.authUserId;
        const { date } = req.query;

        if (!date || typeof date !== 'string') {
            return res.status(400).json({
                error: { code: 'VALIDATION_ERROR', message: 'date query parameter is required.' },
            });
        }

        const log = await dailyLogsService.getLogByDate(userId, date);
        return res.status(200).json(log);
    } catch (e: any) {
        return handleError(res, e);
    }
};

// 기간별 목록 조회
export const getLogsInRange = async (req: Request, res: Response) => {
    try {
        const userId = res.locals.authUserId;
        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({
                error: { code: 'VALIDATION_ERROR', message: 'start_date and end_date are required.' },
            });
        }

        const logs = await dailyLogsService.getLogsInRange(userId, start_date as string, end_date as string);
        return res.status(200).json(logs);
    } catch (e: any) {
        return handleError(res, e);
    }
};

// 전체 목록 조회 (페이징)
export const getAllLogs = async (req: Request, res: Response) => {
    try {
        const userId = res.locals.authUserId;
        const page = parseInt(req.query.page as string) || 1;
        const limitStr = req.query.limit as string;
        const limit = limitStr === '0' ? 0 : parseInt(limitStr) || 10;

        const result = await dailyLogsService.getLogsPaginated(userId, page, limit);
        return res.status(200).json(result);
    } catch (e: any) {
        return handleError(res, e);
    }
};

// 검색
export const searchLogs = async (req: Request, res: Response) => {
    try {
        const userId = res.locals.authUserId;
        const { q } = req.query;

        if (!q || typeof q !== 'string') {
            return res.status(400).json({
                error: { code: 'VALIDATION_ERROR', message: 'q(query) parameter is required.' },
            });
        }

        const results = await dailyLogsService.searchLogs(userId, q);
        return res.status(200).json(results);
    } catch (e: any) {
        return handleError(res, e);
    }
};

// 수정
export const updateLog = async (req: Request, res: Response) => {
    try {
        const userId = res.locals.authUserId;
        const id = req.params.id as string;
        const { title, content, tags, is_dirty, draft_content } = req.body;

        const updated = await dailyLogsService.updateLog(userId, id, {
            title,
            content,
            tags,
            is_dirty,
            draft_content,
        });

        return res.status(200).json(updated);
    } catch (e: any) {
        return handleError(res, e);
    }
};

// 삭제
export const deleteLog = async (req: Request, res: Response) => {
    try {
        const userId = res.locals.authUserId;
        const id = req.params.id as string;

        await dailyLogsService.deleteLog(userId, id);
        return res.status(204).send();
    } catch (e: any) {
        return handleError(res, e);
    }
};
