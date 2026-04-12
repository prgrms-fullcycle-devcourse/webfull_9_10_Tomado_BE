import { serializePomodoroSession } from '../lib/apiSerializers.js';
import { toIsoDateInSeoul } from '../lib/date.js';
import * as pomodoroRepository from '../repositories/pomodoro.repository.js';

const VALID_TYPES = ['focus', 'short_break', 'long_break'];
const VALID_STATUSES = ['completed', 'cancelled', 'skipped'];

const createError = (code: string, message: string, field?: string) => {
    const err = new Error(message) as any;
    err.code = code;
    err.field = field;
    return err;
};

const parseEndedAt = (value: string): Date => {
    const normalized = value.trim().replace(/\s*T\s*/i, 'T');
    const endedAt = new Date(normalized);

    if (Number.isNaN(endedAt.getTime())) {
        throw createError(
            'VALIDATION_ERROR',
            'ended_at은 올바른 ISO 8601 날짜/시간이어야 합니다. 예: 2026-04-11T09:25:00Z',
            'ended_at'
        );
    }

    return endedAt;
};

// 세션 시작
export const createSession = async (userId: string, body: { type: string }) => {
    if (!VALID_TYPES.includes(body.type)) {
        throw createError('VALIDATION_ERROR', 'type은 focus, short_break, long_break 중 하나여야 합니다.', 'type');
    }

    const session = await pomodoroRepository.createSession({
        userId,
        type: body.type,
    });
    return serializePomodoroSession(session);
};

// 세션 종료
export const endSession = async (
    userId: string,
    sessionId: string,
    body: { status: string; actual_sec: number; ended_at: string }
) => {
    if (!VALID_STATUSES.includes(body.status)) {
        throw createError('VALIDATION_ERROR', 'status는 completed, cancelled, skipped 중 하나여야 합니다.', 'status');
    }
    if (!Number.isInteger(body.actual_sec) || body.actual_sec < 0) {
        throw createError('VALIDATION_ERROR', 'actual_sec은 0 이상의 정수여야 합니다.', 'actual_sec');
    }

    const endedAt = parseEndedAt(body.ended_at);

    const session = await pomodoroRepository.findSessionById(sessionId);
    if (!session) throw createError('NOT_FOUND', '해당 세션을 찾을 수 없습니다.');
    if (session.userId !== userId) throw createError('FORBIDDEN', '본인의 세션만 종료할 수 있습니다');
    if (session.status !== null || session.endedAt !== null) {
        throw createError('VALIDATION_ERROR', '이미 종료된 세션입니다.');
    }

    const ended = await pomodoroRepository.endSession(sessionId, {
        status: body.status,
        actualSec: body.actual_sec,
        endedAt,
    });

    if (session.type === 'focus' && body.status === 'completed') {
        await pomodoroRepository.upsertDaliyFocusStat(userId, toIsoDateInSeoul(session.focusDate!), body.actual_sec);
    }

    return serializePomodoroSession(ended);
};

// 세션 목록 조회
export const getSessions = async (userId: string, startDate: string, endDate: string, type?: string) => {
    if (!startDate || !endDate) {
        throw createError('VALIDATION_ERROR', 'start_date, end_date는 필수입니다.');
    }
    if (type !== undefined && !VALID_TYPES.includes(type)) {
        throw createError('VALIDATION_ERROR', 'type은 focus, short_break, long_break 중 하나여야 합니다.', 'type');
    }

    const sessions = await pomodoroRepository.findSessinos(userId, startDate, endDate, type);
    return sessions.map(serializePomodoroSession);
};
