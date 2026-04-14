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

/** 템플릿별 키는 모두 포함하고, 값은 문자열이면 빈 문자열도 허용 */
function validateTemplateContent(
    templateType: TemplateType,
    content: unknown
): asserts content is Record<string, unknown> {
    if (content === null || typeof content !== 'object' || Array.isArray(content)) {
        throwCode('VALIDATION_ERROR', 'content는 객체여야 합니다.', 'content');
    }

    const obj = content as Record<string, unknown>;
    const requiredKeys = TEMPLATE_REQUIRED_KEYS[templateType];
    const missingKeys = requiredKeys.filter((k) => !(k in obj) || typeof obj[k] !== 'string');
    if (missingKeys.length > 0) {
        throwCode(
            'VALIDATION_ERROR',
            `${templateType} 템플릿의 항목은 모두 문자열 키로 포함되어야 합니다: ${missingKeys.join(', ')}`,
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

/** content JSON에서 값을 추출하여 검색어 주변 미리보기 (앞뒤 최대 20자) */
export function buildContentPreview(content: unknown, q: string, templateType?: string): string {
    let text = '';
    if (content && typeof content === 'object' && !Array.isArray(content)) {
        const obj = content as Record<string, unknown>;

        // 템플릿 타입이 유효하면 정해진 순서대로 값 추출, 아니면 기본값 추출
        if (templateType && isTemplateType(templateType)) {
            const keys = TEMPLATE_REQUIRED_KEYS[templateType];
            text = keys
                .map((k) => obj[k])
                .filter((v): v is string => typeof v === 'string')
                .join(' ');
        } else {
            text = Object.values(obj)
                .filter((v) => typeof v === 'string')
                .join(' ');
        }
    } else {
        text = String(content);
    }

    const lower = text.toLowerCase();
    const qi = lower.indexOf(q.toLowerCase());

    // 검색어가 없거나(키값만 매칭된 경우 등) 찾지 못한 경우 처음부터 40자 출력
    if (qi === -1) {
        return text.length > 40 ? text.slice(0, 40) + '...' : text;
    }

    // 검색어 기준 앞뒤 약 20자 추출
    const start = Math.max(0, qi - 20);
    const end = Math.min(text.length, qi + q.length + 20);

    let result = text.slice(start, end);
    if (start > 0) result = '...' + result;
    if (end < text.length) result = result + '...';

    return result;
}

export async function getRetro(
    userId: string,
    query: { date?: string; daily_log_id?: string }
): Promise<Array<ReturnType<typeof serializeRetroLog>>> {
    const date = query.date?.trim();
    const daily_log_id = query.daily_log_id?.trim();

    if (!date) {
        throwCode('VALIDATION_ERROR', 'date는 필수입니다.', 'date');
    }

    if (daily_log_id) {
        const dailyLog = await retroRepo.findDailyLogOwnedByUser(daily_log_id, userId);
        if (!dailyLog) {
            throwCode('NOT_FOUND', '해당 일일 로그가 존재하지 않습니다.');
        }
        if (retroRepo.toIsoDate(dailyLog.logDate) !== date) {
            throwCode('VALIDATION_ERROR', 'date와 연결된 일일 로그의 log_date가 일치하지 않습니다.', 'date');
        }
    }

    const rows = await retroRepo.findRetrosByUserAndDate(userId, new Date(date));
    return rows.map(serializeRetroLog);
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

    const row = await prisma.$transaction(async (tx) => {
        const existing = await retroRepo.findRetroByUserDateAndTemplate(
            userId,
            new Date(retro_date),
            template_type,
            tx
        );
        if (existing) {
            throwCode('CONFLICT', `${retro_date} 날짜에 ${template_type} 템플릿 회고가 이미 존재합니다.`);
        }

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
        content_preview: buildContentPreview(row.content, q, row.templateType),
    }));
}

export async function listRetros(userId: string, query: { page?: number; page_size?: number }) {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 10;

    if (!Number.isInteger(page) || page < 1) {
        throwCode('VALIDATION_ERROR', 'page는 1 이상의 정수여야 합니다.', 'page');
    }
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
        throwCode('VALIDATION_ERROR', 'page_size는 1~100 범위의 정수여야 합니다.', 'page_size');
    }

    const skip = (page - 1) * pageSize;
    const totalCount = await retroRepo.countDistinctRetroDatesByUser(userId);
    const retroDates = await retroRepo.findRetroDatesByUser(userId, skip, pageSize);
    const rows = await retroRepo.findRetroListRowsByUserAndDates(userId, retroDates);
    const byDate = new Map<
        string,
        {
            retro_date: string;
            template_types: string[];
            count: number;
            latest_created_at: string;
            retros: Array<ReturnType<typeof serializeRetroLog>>;
        }
    >();

    for (const row of rows) {
        const retroDate = retroRepo.toIsoDate(row.retroDate);
        const createdAt = row.createdAt.toISOString();
        const serialized = serializeRetroLog(row);
        const existing = byDate.get(retroDate);

        if (!existing) {
            byDate.set(retroDate, {
                retro_date: retroDate,
                template_types: [row.templateType],
                count: 1,
                latest_created_at: createdAt,
                retros: [serialized],
            });
            continue;
        }

        if (!existing.template_types.includes(row.templateType)) {
            existing.template_types.push(row.templateType);
        }
        existing.count += 1;
        existing.retros.push(serialized);
        if (existing.latest_created_at < createdAt) {
            existing.latest_created_at = createdAt;
        }
    }

    const items = Array.from(byDate.values());
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
        items,
        page,
        page_size: pageSize,
        total_count: totalCount,
        total_pages: totalPages,
        has_next: page < totalPages,
    };
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
        const remaining = await retroRepo.countRetrosByUserAndDate(userId, focusDate, tx);
        await retroRepo.upsertDailyFocusStatHasRetro(userId, focusDate, remaining > 0, tx);
    });
}
