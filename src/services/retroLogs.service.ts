import type { Prisma, RetroLog } from '@prisma/client';

import { prisma } from '../lib/prisma.js';
import * as retroRepo from '../repositories/retroLogs.repository.js';

const TEMPLATE_TYPES = ['Tech', 'Decision', 'Communication', 'Emotion'] as const;
export type TemplateType = (typeof TEMPLATE_TYPES)[number];

const TEMPLATE_REQUIRED_KEYS: Record<TemplateType, readonly string[]> = {
    Tech: ['learned_today', 'applied_technology', 'technical_difficulty', 'next_to_try'],
    Decision: ['decision_made', 'decision_reason', 'outcome_impact', 'alternatives_considered'],
    Communication: ['communication_highlights', 'communication_friction', 'feedback_received', 'improvements'],
    Emotion: ['mood_today', 'what_energized', 'what_drained', 'grateful_for'],
};

function isTemplateType(v: unknown): v is TemplateType {
    return typeof v === 'string' && (TEMPLATE_TYPES as readonly string[]).includes(v);
}

function throwCode(code: string, message: string, field?: string): never {
    const err = new Error(message) as Error & { code: string; field?: string };
    err.code = code;
    if (field !== undefined) err.field = field;
    throw err;
}

function validateTemplateContent(
    templateType: TemplateType,
    content: unknown
): asserts content is Record<string, unknown> {
    if (content === null || typeof content !== 'object' || Array.isArray(content)) {
        throwCode('VALIDATION_ERROR', 'content는 객체여야 합니다.', 'content');
    }

    const requiredKeys = TEMPLATE_REQUIRED_KEYS[templateType];
    const missingKeys = requiredKeys.filter((k) => {
        const v = (content as Record<string, unknown>)[k];
        return typeof v !== 'string' || v.trim() === '';
    });

    if (missingKeys.length > 0) {
        throwCode(
            'VALIDATION_ERROR',
            `${templateType} 템플릿의 필수 항목이 누락되었습니다: ${missingKeys.join(', ')}`,
            'content'
        );
    }
}

export function serializeRetroLog(row: RetroLog) {
    return {
        id: row.id,
        user_id: row.userId,
        daily_log_id: row.dailyLogId,
        retro_date: retroRepo.toIsoDate(row.retroDate),
        template_type: row.templateType,
        content: row.content,
        is_dirty: row.isDirty,
        draft_content: row.draftContent,
        created_at: row.createdAt.toISOString(),
        updated_at: row.updatedAt.toISOString(),
    };
}

/** content JSON에서 검색어 주변 미리보기 (앞뒤 최대 50자) */
export function buildContentPreview(content: unknown, q: string): string {
    const text = typeof content === 'object' && content !== null ? JSON.stringify(content) : String(content);
    const lower = text.toLowerCase();
    const qi = lower.indexOf(q.toLowerCase());
    if (qi === -1) {
        return text.slice(0, 100);
    }
    const start = Math.max(0, qi - 50);
    const end = Math.min(text.length, qi + q.length + 50);
    return text.slice(start, end);
}

export async function getRetro(
    userId: string,
    query: { date?: string; daily_log_id?: string }
): Promise<ReturnType<typeof serializeRetroLog>> {
    const date = query.date?.trim();
    const daily_log_id = query.daily_log_id?.trim();

    if (!date) {
        throwCode('VALIDATION_ERROR', 'date는 필수입니다.', 'date');
    }
    if (!daily_log_id) {
        throwCode('VALIDATION_ERROR', 'daily_log_id는 필수입니다.', 'daily_log_id');
    }

    const row = await retroRepo.findRetroByUserAndDailyLogId(userId, daily_log_id);
    if (row && retroRepo.toIsoDate(row.retroDate) !== date) {
        throwCode('VALIDATION_ERROR', 'date와 연결된 회고의 retro_date가 일치하지 않습니다.', 'date');
    }

    if (!row) {
        throwCode('NOT_FOUND', '해당 날짜의 회고가 존재하지 않습니다.');
    }

    return serializeRetroLog(row);
}

export async function createRetro(
    userId: string,
    body: {
        daily_log_id?: string | null;
        retro_date: string;
        template_type: unknown;
        content: unknown;
    }
): Promise<ReturnType<typeof serializeRetroLog>> {
    const { daily_log_id, retro_date, template_type, content } = body;

    const normalizedDailyLogId =
        typeof daily_log_id === 'string' && daily_log_id.trim() !== '' ? daily_log_id.trim() : null;

    if (!retro_date || typeof retro_date !== 'string') {
        throwCode('VALIDATION_ERROR', 'retro_date는 필수입니다.', 'retro_date');
    }
    if (!isTemplateType(template_type)) {
        throwCode(
            'VALIDATION_ERROR',
            'template_type은 Tech, Decision, Communication, Emotion 중 하나여야 합니다.',
            'template_type'
        );
    }
    validateTemplateContent(template_type, content);

    if (normalizedDailyLogId !== null) {
        const dailyLog = await retroRepo.findDailyLogOwnedByUser(normalizedDailyLogId, userId);
        if (!dailyLog) {
            throwCode('NOT_FOUND', '해당 일일 로그가 존재하지 않습니다.');
        }

        if (retroRepo.toIsoDate(dailyLog.logDate) !== retro_date) {
            throwCode('VALIDATION_ERROR', 'retro_date는 연결된 일일 로그의 날짜와 같아야 합니다.', 'retro_date');
        }
    }

    const existing = await retroRepo.findRetroByUserAndRetroDate(userId, new Date(retro_date));
    if (existing) {
        throwCode('CONFLICT', `${retro_date} 날짜의 회고가 이미 존재합니다.`);
    }

    const row = await prisma.$transaction(async (tx) => {
        const created = await retroRepo.createRetro(
            {
                userId,
                dailyLogId: normalizedDailyLogId,
                retroDate: new Date(retro_date),
                templateType: template_type,
                content: content as Prisma.InputJsonValue,
            },
            tx
        );
        await retroRepo.upsertDailyFocusStatHasRetro(userId, new Date(retro_date), true, tx);
        return created;
    });

    return serializeRetroLog(row);
}

export async function searchRetros(userId: string, q: string) {
    const ids = await retroRepo.searchRetroIdsByContent(userId, q);
    const rows = await retroRepo.findRetrosByIds(userId, ids);
    return rows.map((row) => ({
        id: row.id,
        daily_log_id: row.dailyLogId,
        retro_date: retroRepo.toIsoDate(row.retroDate),
        template_type: row.templateType,
        content_preview: buildContentPreview(row.content, q),
    }));
}

export async function updateRetro(
    userId: string,
    id: string,
    body: { content?: unknown; is_dirty?: unknown; draft_content?: unknown }
): Promise<ReturnType<typeof serializeRetroLog>> {
    const row = await retroRepo.findRetroById(id);
    if (!row) {
        throwCode('NOT_FOUND', '해당 회고를 찾을 수 없습니다.');
    }
    if (row.userId !== userId) {
        throwCode('FORBIDDEN', '본인의 회고만 수정할 수 있습니다.');
    }
    if (!isTemplateType(row.templateType)) {
        throwCode('VALIDATION_ERROR', '알 수 없는 template_type입니다.', 'template_type');
    }

    const patch: {
        content?: Prisma.InputJsonValue;
        isDirty?: boolean;
        draftContent?: Prisma.InputJsonValue | null;
    } = {};

    if (body.content !== undefined) {
        validateTemplateContent(row.templateType, body.content);
        patch.content = body.content as Prisma.InputJsonValue;
    }
    if (body.is_dirty !== undefined) {
        if (typeof body.is_dirty !== 'boolean') {
            throwCode('VALIDATION_ERROR', 'is_dirty는 boolean이어야 합니다.', 'is_dirty');
        }
        patch.isDirty = body.is_dirty;
    }
    if (body.draft_content !== undefined) {
        if (body.draft_content !== null && typeof body.draft_content !== 'object') {
            throwCode('VALIDATION_ERROR', 'draft_content는 객체 또는 null이어야 합니다.', 'draft_content');
        }
        patch.draftContent = body.draft_content === null ? null : (body.draft_content as Prisma.InputJsonValue);
    }

    if (Object.keys(patch).length === 0) {
        throwCode('VALIDATION_ERROR', '수정할 필드가 없습니다.');
    }

    const updated = await retroRepo.updateRetro(id, patch);
    return serializeRetroLog(updated);
}

export async function deleteRetro(userId: string, id: string): Promise<void> {
    const row = await retroRepo.findRetroById(id);
    if (!row) {
        throwCode('NOT_FOUND', '해당 회고를 찾을 수 없습니다.');
    }
    if (row.userId !== userId) {
        throwCode('FORBIDDEN', '본인의 회고만 삭제할 수 있습니다.');
    }

    const focusDate = row.retroDate;
    await prisma.$transaction(async (tx) => {
        await retroRepo.deleteRetro(id, tx);
        await retroRepo.upsertDailyFocusStatHasRetro(userId, focusDate, false, tx);
    });
}
