import type { NextFunction, Request, Response } from 'express';

import { ACCESS_TOKEN_COOKIE_NAME, getCookie } from '../../lib/authCookies.js';
import { supabaseClient } from '../../lib/supabase.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authorizationHeader = req.headers.authorization;
    const matched = authorizationHeader != null ? /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim()) : null;
    const token = matched?.[1]?.trim() || getCookie(req, ACCESS_TOKEN_COOKIE_NAME);

    if (token == null || token === '') {
        res.status(401).json({
            error: {
                code: 'UNAUTHORIZED',
                message: '유효하지 않거나 만료된 Access Token입니다.',
            },
        });
        return;
    }

    const { data, error } = await supabaseClient.auth.getUser(token);
    if (error || data.user == null) {
        res.status(401).json({
            error: {
                code: 'UNAUTHORIZED',
                message: '유효하지 않거나 만료된 Access Token입니다.',
            },
        });
        return;
    }

    res.locals.authUserId = data.user.id;
    res.locals.authAccessToken = token;
    next();
}
