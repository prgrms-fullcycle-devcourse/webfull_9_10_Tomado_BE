import * as pomodoroRepository from '../repositories/pomodoro.repository.js';

const VALID_TYPES = ['focus', 'short_break', 'long_break'];
const VALID_STATUSES = ['completed', 'cancelled'];

const createError = (code: string, message: string, field?: string) => {
    const err = new Error(message) as any;
    err.code = code;
    err.field = field;
    return err;
};

// 세션 시작
export const createSession = async (userId: string, body: { type: string; focus_date: string }) => {
    if (!VALID_TYPES.includes(body.type)) {
        throw createError('VALIDATION_ERROR', 'type은 focus, short_break, long_break 중 하나여야 합니다.', 'type');
    }

    return pomodoroRepository.createSession({
        userId,
        type: body.type,
        focusDate: body.focus_date,
    });
};

// 세션 종료
export const endSession = async (
    userId: string,
    sessionId: string,
    body: { status: string; actual_sec: number; ended_at: string }
) => {
    if (!VALID_STATUSES.includes(body.status)) {
        throw createError('VALIDATION_ERROR', 'status는 completed 또는 cancelled여야 합니다.', 'status');
    }

    const session = await pomodoroRepository.findSessionById(sessionId);
    if (!session) throw createError('NOT_FOUND', '해당 세션을 찾을 수 없습니다.');
    if (session.userId !== userId) throw createError('FORBIDDEN', '본인의 세션만 종료할 수 있습니다');

    const ended = await pomodoroRepository.endSession(sessionId, {
        status: body.status,
        actualSec: body.actual_sec,
        endedAt: body.ended_at,
    });

    if (session.type === 'focus' && body.status === 'completed') {
        await pomodoroRepository.upsertDaliyFocusStat(
            userId,
            session.focusDate!.toISOString().split('T')[0]!,
            body.actual_sec
        );
    }

    return ended;
};

// 세션 목록 조회
export const getSessions = async (userId: string, startDate: string, endDate: string, type?: string) => {
    if (!startDate || !endDate) {
        throw createError('VALIDATION_ERROR', 'start_date, end_date는 필수입니다.');
    }
    if (type !== undefined && !VALID_TYPES.includes(type)) {
        throw createError('VALIDATION_ERROR', 'type은 focus, short_break, long_break 중 하나여야 합니다.', 'type');
    }

    return pomodoroRepository.findSessinos(userId, startDate, endDate, type);
};
