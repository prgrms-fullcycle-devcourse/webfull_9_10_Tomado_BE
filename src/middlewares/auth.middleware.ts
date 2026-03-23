import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = {
        id: 'ad33aae0-4e36-4778-9fa5-85f2aae8177b',
        login_id: 'testUser',
    };
    next();
};
