import { Request, Response, NextFunction } from 'express';
import * as todosService from '../services/todos.service.js';

export const getTodos = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { date } = req.query;

        if (!date || typeof date !== 'string') {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'date 쿼리 파라미터는 필수입니다.',
                    field: 'date',
                },
            });
        }

        const todos = await todosService.getTodos(res.locals.authUserId as string, date);
        res.status(200).json(todos);
    } catch (err) {
        next(err);
    }
};

export const createTodo = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, description, assigned_date } = req.body;
        console.log('현재 로그인된 유저 ID:', res.locals.authUserId);
        // 필수값 체크
        if (!title) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'title은 필수 항목입니다.',
                    field: 'title',
                },
            });
        }
        if (!assigned_date) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'assigned_date는 필수 항목입니다.',
                    field: 'assigned_date',
                },
            });
        }

        const todo = await todosService.createTodo(res.locals.authUserId as string, {
            title,
            description,
            assigned_date,
        });

        res.status(201).json(todo);
    } catch (err) {
        next(err);
    }
};

export const deleteTodo = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        await todosService.deleteTodo(res.locals.authUserId as string, id);
        res.status(204).send();
    } catch (err: any) {
        const statusMap: Record<string, number> = {
            NOT_FOUND: 404,
            FORBIDDEN: 403,
            VALIDATION_ERROR: 400,
        };
        const status = statusMap[err.code] ?? 500;
        res.status(status).json({ error: { code: err.code, message: err.message } });
    }
};

export const updateTodo = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, description, assigned_date } = req.body;
        const todo = await todosService.updateTodo(res.locals.authUserId as string, req.params.id as string, {
            title,
            description,
            assigned_date,
        });
        res.status(200).json(todo);
    } catch (err: any) {
        const statusMap: Record<string, number> = {
            NOT_FOUND: 404,
            FORBIDDEN: 403,
        };
        const status = statusMap[err.code] ?? 500;
        res.status(status).json({ error: { code: err.code, message: err.message } });
    }
};

export const toggleComplete = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { completed } = req.body;

        if (typeof completed !== 'boolean') {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'completed는 boolean이어야 합니다.',
                    field: 'completed',
                },
            });
        }

        const todo = await todosService.toggleComplete(
            res.locals.authUserId as string,
            req.params.id as string,
            completed
        );
        res.status(200).json(todo);
    } catch (err: any) {
        const statusMap: Record<string, number> = {
            NOT_FOUND: 404,
            FORBIDDEN: 403,
        };
        const status = statusMap[err.code] ?? 500;
        res.status(status).json({ error: { code: err.code, message: err.message } });
    }
};

export const reorderTodo = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { prev_order, next_order } = req.body;
        const todo = await todosService.reorderTodo(
            res.locals.authUserId as string,
            req.params.id as string,
            prev_order ?? null,
            next_order ?? null
        );
        res.status(200).json(todo);
    } catch (err: any) {
        const statusMap: Record<string, number> = {
            NOT_FOUND: 404,
            FORBIDDEN: 403,
            VALIDATION_ERROR: 400,
        };
        const status = statusMap[err.code] ?? 500;
        res.status(status).json({ error: { code: err.code, message: err.message } });
    }
};
