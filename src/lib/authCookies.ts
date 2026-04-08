import type { Request, Response } from 'express';

import { env } from '../env.js';

export const ACCESS_TOKEN_COOKIE_NAME = 'access_token';
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

function isProduction() {
    return env.NODE_ENV === 'production';
}

function getAuthCookieOptions() {
    const secure = isProduction();

    return {
        httpOnly: true,
        sameSite: secure ? ('none' as const) : ('lax' as const),
        secure,
        path: '/',
    };
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
    const cookieOptions = getAuthCookieOptions();

    res.cookie(ACCESS_TOKEN_COOKIE_NAME, tokens.accessToken, cookieOptions);

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, cookieOptions);
}

export function clearAuthCookies(res: Response) {
    const cookieOptions = getAuthCookieOptions();

    res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, cookieOptions);

    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, cookieOptions);
}
