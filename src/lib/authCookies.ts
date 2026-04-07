import type { Request, Response } from 'express';

import { env } from '../env.js';

export const ACCESS_TOKEN_COOKIE_NAME = 'access_token';
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

function isProduction() {
    return env.NODE_ENV === 'production';
}

function parseCookieHeader(cookieHeader: string | undefined) {
    if (cookieHeader == null || cookieHeader.trim() === '') {
        return {};
    }

    return cookieHeader.split(';').reduce<Record<string, string>>((acc, part) => {
        const trimmed = part.trim();
        if (trimmed === '') {
            return acc;
        }

        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex < 0) {
            return acc;
        }

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim();

        if (key !== '') {
            acc[key] = decodeURIComponent(value);
        }

        return acc;
    }, {});
}

export function getCookie(req: Request, name: string) {
    const cookies = parseCookieHeader(req.headers.cookie);
    return cookies[name];
}

export function setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    const secure = isProduction();

    res.cookie(ACCESS_TOKEN_COOKIE_NAME, tokens.accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure,
        path: '/',
    });

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure,
        path: '/',
    });
}

export function clearAuthCookies(res: Response) {
    const secure = isProduction();

    res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'lax',
        secure,
        path: '/',
    });

    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'lax',
        secure,
        path: '/',
    });
}
