import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { env } from '../env.js';
import { AuthHttpError } from '../lib/authErrors.js';
import * as authRepo from '../repositories/auth.repository.js';

/** DB 스키마에 비밀번호 컬럼이 없어, 서버 프로세스 메모리에만 해시를 둡니다(재시작 시 로그인 불가). */
const passwordHashByLoginId = new Map<string, string>();

/** Refresh Token rotation: userId → 활성 refresh jti 집합 */
const refreshJtisByUserId = new Map<string, Set<string>>();

const registerBodySchema = z.object({
    login_id: z
        .string()
        .regex(/^[a-zA-Z0-9]{4,20}$/, 'login_id는 4~20자 영문+숫자여야 합니다.')
        .describe('login_id'),
    password: z
        .string()
        .min(8, '비밀번호는 8자 이상이어야 합니다.')
        .refine(
            (p) => /[A-Za-z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p),
            '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.'
        ),
    nickname: z.string().trim().min(2, '닉네임은 2~20자여야 합니다.').max(20, '닉네임은 2~20자여야 합니다.'),
});

const loginBodySchema = z.object({
    login_id: z.string().min(1),
    password: z.string().min(1),
});

const refreshBodySchema = z.object({
    refresh_token: z.string().min(1),
});

type JwtPayloadBase = jwt.JwtPayload & {
    sub: string;
    typ: 'access' | 'refresh';
    jti?: string;
};

function addRefreshJti(userId: string, jti: string) {
    let set = refreshJtisByUserId.get(userId);
    if (!set) {
        set = new Set();
        refreshJtisByUserId.set(userId, set);
    }
    set.add(jti);
}

function removeRefreshJti(userId: string, jti: string) {
    refreshJtisByUserId.get(userId)?.delete(jti);
}

function clearRefreshJtisForUser(userId: string) {
    refreshJtisByUserId.delete(userId);
}

function hasRefreshJti(userId: string, jti: string): boolean {
    return refreshJtisByUserId.get(userId)?.has(jti) ?? false;
}

function issueTokenPair(userId: string): { access_token: string; refresh_token: string } {
    const jti = randomUUID();

    const access_token = jwt.sign({ sub: userId, typ: 'access' satisfies JwtPayloadBase['typ'] }, env.JWT_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRES as SignOptions['expiresIn'],
    });

    const refresh_token = jwt.sign(
        {
            sub: userId,
            typ: 'refresh' satisfies JwtPayloadBase['typ'],
            jti,
        },
        env.JWT_SECRET,
        { expiresIn: env.JWT_REFRESH_EXPIRES as SignOptions['expiresIn'] }
    );

    addRefreshJti(userId, jti);

    return { access_token, refresh_token };
}

function mapZodError(e: z.ZodError): AuthHttpError {
    const first = e.errors[0];
    if (!first) {
        return new AuthHttpError(400, 'VALIDATION_ERROR', '요청 파라미터가 올바르지 않습니다.');
    }
    const field = first.path[0] != null ? String(first.path[0]) : undefined;
    return new AuthHttpError(400, 'VALIDATION_ERROR', first.message, field);
}

function serializeUser(u: {
    id: string;
    loginId: string;
    nickname: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}) {
    return {
        id: u.id,
        login_id: u.loginId,
        nickname: u.nickname,
        avatar_url: u.avatarUrl,
        created_at: u.createdAt.toISOString(),
        updated_at: u.updatedAt.toISOString(),
    };
}

export async function register(rawBody: unknown) {
    const parsed = registerBodySchema.safeParse(rawBody);
    if (!parsed.success) {
        throw mapZodError(parsed.error);
    }
    const { login_id, password, nickname } = parsed.data;

    const hash = await bcrypt.hash(password, 10);

    try {
        const user = await authRepo.createUserWithSettings(login_id, nickname);
        passwordHashByLoginId.set(login_id, hash);
        const tokens = issueTokenPair(user.id);
        return {
            status: 201 as const,
            body: {
                ...tokens,
                user: serializeUser(user),
            },
        };
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            throw new AuthHttpError(409, 'CONFLICT', '이미 사용 중인 login_id입니다.', 'login_id');
        }
        throw e;
    }
}

export async function login(rawBody: unknown) {
    const parsed = loginBodySchema.safeParse(rawBody);
    if (!parsed.success) {
        throw mapZodError(parsed.error);
    }
    const { login_id, password } = parsed.data;

    const user = await authRepo.findUserByLoginId(login_id);
    const storedHash = passwordHashByLoginId.get(login_id);

    const ok = user != null && storedHash != null && (await bcrypt.compare(password, storedHash));

    if (!ok) {
        throw new AuthHttpError(401, 'UNAUTHORIZED', '아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    const tokens = issueTokenPair(user.id);
    return {
        status: 200 as const,
        body: {
            ...tokens,
            user: serializeUser(user),
        },
    };
}

export async function refresh(rawBody: unknown) {
    const parsed = refreshBodySchema.safeParse(rawBody);
    if (!parsed.success) {
        throw mapZodError(parsed.error);
    }
    const { refresh_token } = parsed.data;

    let payload: JwtPayloadBase;
    try {
        payload = jwt.verify(refresh_token, env.JWT_SECRET) as JwtPayloadBase;
    } catch {
        throw new AuthHttpError(401, 'UNAUTHORIZED', 'Refresh Token이 만료되었거나 유효하지 않습니다.');
    }

    if (payload.typ !== 'refresh' || typeof payload.sub !== 'string' || typeof payload.jti !== 'string') {
        throw new AuthHttpError(401, 'UNAUTHORIZED', 'Refresh Token이 만료되었거나 유효하지 않습니다.');
    }

    const userId = payload.sub;
    const jti = payload.jti;

    if (!hasRefreshJti(userId, jti)) {
        throw new AuthHttpError(401, 'UNAUTHORIZED', 'Refresh Token이 만료되었거나 유효하지 않습니다.');
    }

    // Rotation: 기존 refresh 즉시 폐기 후 새 쌍 발급
    removeRefreshJti(userId, jti);
    const tokens = issueTokenPair(userId);

    return {
        status: 200 as const,
        body: tokens,
    };
}

export function logout(authorizationHeader: string | undefined) {
    const token = extractBearer(authorizationHeader);
    if (token == null) {
        throw new AuthHttpError(401, 'UNAUTHORIZED', '유효하지 않거나 만료된 Access Token입니다.');
    }

    let payload: JwtPayloadBase;
    try {
        payload = jwt.verify(token, env.JWT_SECRET) as JwtPayloadBase;
    } catch {
        throw new AuthHttpError(401, 'UNAUTHORIZED', '유효하지 않거나 만료된 Access Token입니다.');
    }

    if (payload.typ !== 'access' || typeof payload.sub !== 'string') {
        throw new AuthHttpError(401, 'UNAUTHORIZED', '유효하지 않거나 만료된 Access Token입니다.');
    }

    clearRefreshJtisForUser(payload.sub);
    return { status: 204 as const };
}

function extractBearer(authorizationHeader: string | undefined): string | null {
    if (authorizationHeader == null || authorizationHeader.trim() === '') {
        return null;
    }
    const m = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
    return m?.[1]?.trim() ?? null;
}
