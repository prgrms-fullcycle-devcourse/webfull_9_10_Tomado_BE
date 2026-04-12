import type { DailyFocusStat, DailyLog, PomodoroSession, Todo, User, UserSetting } from '@prisma/client';
import { toIsoDateInSeoul } from './date.js';

function toIsoDate(value: Date): string {
    return toIsoDateInSeoul(value);
}

function toIsoDateTime(value: Date): string {
    return value.toISOString();
}

export function serializeUser(user: User, avatarUrlOverride?: string | null) {
    return {
        id: user.id,
        login_id: user.loginId,
        nickname: user.nickname,
        avatar_url: avatarUrlOverride ?? user.avatarUrl,
        created_at: toIsoDateTime(user.createdAt),
        updated_at: toIsoDateTime(user.updatedAt),
    };
}

export function serializeUserSetting(setting: UserSetting) {
    return {
        id: setting.id,
        user_id: setting.userId,
        focus_min: setting.focusMin,
        short_break_min: setting.shortBreakMin,
        long_break_min: setting.longBreakMin,
        sessions_per_set: setting.sessionsPerSet,
        auto_carry_todo: setting.autoCarryTodo,
        updated_at: toIsoDateTime(setting.updatedAt),
    };
}

export function serializeTodo(todo: Todo) {
    return {
        id: todo.id,
        user_id: todo.userId,
        title: todo.title,
        description: todo.description,
        assigned_date: toIsoDate(todo.assignedDate),
        sort_order: todo.sortOrder,
        completed_at: todo.completedAt?.toISOString() ?? null,
        created_at: toIsoDateTime(todo.createdAt),
        updated_at: toIsoDateTime(todo.updatedAt),
    };
}

export function serializePomodoroSession(session: PomodoroSession) {
    return {
        id: session.id,
        user_id: session.userId,
        type: session.type,
        status: session.status,
        actual_sec: session.actualSec,
        focus_date: toIsoDate(session.focusDate),
        started_at: toIsoDateTime(session.startedAt),
        ended_at: session.endedAt?.toISOString() ?? null,
        created_at: toIsoDateTime(session.createdAt),
    };
}

export function serializeDailyLog(log: DailyLog) {
    return {
        id: log.id,
        user_id: log.userId,
        log_date: toIsoDate(log.logDate),
        title: log.title,
        content: log.content,
        tags: log.tags,
        is_dirty: log.isDirty,
        draft_content: log.draftContent,
        created_at: toIsoDateTime(log.createdAt),
        updated_at: toIsoDateTime(log.updatedAt),
    };
}

export function serializeDailyFocusStat(stat: DailyFocusStat) {
    return {
        focus_date: toIsoDate(stat.focusDate),
        total_focus_sec: stat.totalFocusSec,
        completed_sessions: stat.completedSessions,
        completed_todos: stat.completedTodos,
        has_daily_log: stat.hasDailyLog,
        has_retro_log: stat.hasRetroLog,
    };
}
