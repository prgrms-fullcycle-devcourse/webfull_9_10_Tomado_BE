import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { AuthHttpError } from '../lib/authErrors.js';
import { serializeUser } from '../lib/apiSerializers.js';
import { supabaseAdmin, supabaseClient } from '../lib/supabase.js';
import * as authRepo from '../repositories/auth.repository.js';

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
    refresh_token: z.string().min(1).optional(),
});

const loginIdCheckQuerySchema = z.object({
    login_id: z
        .string()
        .regex(/^[a-zA-Z0-9]{4,20}$/, 'login_id는 4~20자 영문+숫자여야 합니다.')
        .describe('login_id'),
});

function mapZodError(e: z.ZodError): AuthHttpError {
    const first = e.errors[0];
    if (!first) {
        return new AuthHttpError(400, 'VALIDATION_ERROR', '요청 파라미터가 올바르지 않습니다.');
    }
    const field = first.path[0] != null ? String(first.path[0]) : undefined;
    return new AuthHttpError(400, 'VALIDATION_ERROR', first.message, field);
}

function loginIdToEmail(loginId: string) {
    return `${loginId}@tomado.local`;
}

function mapSupabaseAuthErrorToHttp(errorMessage: string): AuthHttpError {
    const msg = errorMessage.toLowerCase();
    if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('duplicate')) {
        return new AuthHttpError(409, 'CONFLICT', '이미 사용 중인 login_id입니다.', 'login_id');
    }
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        return new AuthHttpError(401, 'UNAUTHORIZED', '아이디 또는 비밀번호가 올바르지 않습니다.');
    }
    return new AuthHttpError(400, 'VALIDATION_ERROR', '인증 요청을 처리할 수 없습니다.');
}

export async function register(rawBody: unknown) {
    const parsed = registerBodySchema.safeParse(rawBody);
    if (!parsed.success) {
        throw mapZodError(parsed.error);
    }
    const { login_id, password, nickname } = parsed.data;
    const email = loginIdToEmail(login_id);
    const existing = await authRepo.findUserByLoginId(login_id);
    if (existing != null) {
        throw new AuthHttpError(409, 'CONFLICT', '이미 사용 중인 login_id입니다.', 'login_id');
    }

    const { data: createdAuthUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            login_id,
            nickname,
        },
    });
    if (createAuthError) {
        throw mapSupabaseAuthErrorToHttp(createAuthError.message);
    }
    const authUserId = createdAuthUser.user?.id;
    if (authUserId == null) {
        throw new AuthHttpError(500, 'INTERNAL_ERROR', '인증 계정 생성에 실패했습니다.');
    }

    try {
        const user = await authRepo.createUserWithSettings(authUserId, login_id, nickname);
        const { data: signedIn, error: signInError } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });
        if (signInError || signedIn.session == null) {
            throw new AuthHttpError(500, 'INTERNAL_ERROR', '회원가입 후 토큰 발급에 실패했습니다.');
        }
        return {
            status: 201 as const,
            body: {
                access_token: signedIn.session.access_token,
                refresh_token: signedIn.session.refresh_token,
                user: serializeUser(user),
            },
        };
    } catch (e) {
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            throw new AuthHttpError(409, 'CONFLICT', '이미 사용 중인 login_id입니다.', 'login_id');
        }
        throw e;
    }
}

export async function checkLoginId(rawQuery: unknown) {
    const parsed = loginIdCheckQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
        throw mapZodError(parsed.error);
    }

    const { login_id } = parsed.data;
    const existing = await authRepo.findUserByLoginId(login_id);

    return {
        status: 200 as const,
        body: {
            login_id,
            available: existing == null,
        },
    };
}

export async function login(rawBody: unknown) {
    const parsed = loginBodySchema.safeParse(rawBody);
    if (!parsed.success) {
        throw mapZodError(parsed.error);
    }
    const { login_id, password } = parsed.data;

    const user = await authRepo.findUserByLoginId(login_id);
    if (user == null) {
        throw new AuthHttpError(401, 'UNAUTHORIZED', '아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: loginIdToEmail(login_id),
        password,
    });
    if (error || data.session == null) {
        throw mapSupabaseAuthErrorToHttp(error?.message ?? 'invalid login credentials');
    }

    return {
        status: 200 as const,
        body: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
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
    if (refresh_token == null) {
        throw new AuthHttpError(
            400,
            'VALIDATION_ERROR',
            'refresh_token 쿠키 또는 body 값이 필요합니다.',
            'refresh_token'
        );
    }
    const { data, error } = await supabaseClient.auth.refreshSession({
        refresh_token,
    });
    if (error || data.session == null) {
        throw new AuthHttpError(401, 'UNAUTHORIZED', 'Refresh Token이 만료되었거나 유효하지 않습니다.');
    }

    return {
        status: 200 as const,
        body: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
        },
    };
}

export async function logout(accessToken: string) {
    const { error } = await supabaseAdmin.auth.admin.signOut(accessToken, 'global');
    if (error) {
        throw new AuthHttpError(401, 'UNAUTHORIZED', '유효하지 않거나 만료된 Access Token입니다.');
    }
    return { status: 204 as const };
}
