import { serializeDailyFocusStat } from '../lib/apiSerializers.js';
import { toIsoDateInSeoul } from '../lib/date.js';
import * as statsRepository from '../repositories/stats.repository.js';

// 스트릭 계산 함수
const calculateStreak = (focusDates: Date[]): number => {
    if (focusDates.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateSet = new Set(focusDates.map((d) => toIsoDateInSeoul(d)));

    let streak = 0;
    const current = new Date(today);
    const todayStr = toIsoDateInSeoul(today);

    // 오늘 기록이 없으면 어제부터 연속 기록을 계산해 UX상 자연스럽게 유지한다.
    if (!dateSet.has(todayStr)) {
        current.setDate(current.getDate() - 1);
    }

    while (true) {
        const dateStr = toIsoDateInSeoul(current);
        if (dateSet.has(dateStr)) {
            streak++;
            current.setDate(current.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
};

// 누적 기록 조회
export const getOverallStats = async (userId: string) => {
    const stats = await statsRepository.findOverallStats(userId);

    return {
        streak: calculateStreak(stats.focusDates),
        total_sessions: stats.totalSessions,
        total_focus_sec: stats.totalFocusSec,
        total_daily_logs: stats.totalDailyLogs,
        total_retro_logs: stats.totalRetroLogs,
    };
};

// 히트맵 페이지 상단 통계
export const getHeatmapSummary = async (userId: string) => {
    const result = await statsRepository.findHeatmapSummary(userId);
    return {
        total_sessions: result.totalSessions,
        total_focus_sec: result.totalFocusSec,
        daily_avg_sessions: result.dailyAvgSessions,
    };
};

// 히트맵 데이터
export const getHeatmap = async (userId: string) => {
    const stats = await statsRepository.findHeatmap(userId);
    return stats.map(serializeDailyFocusStat);
};

// 달력 데이터
export const getCalendar = async (userId: string, year: number, month: number) => {
    if (month < 1 || month > 12) {
        const err = new Error('month는 1~12 사이여야 합니다.') as any;
        err.code = 'VALIDATION_ERROR';
        err.field = 'month';
        throw err;
    }

    const stats = await statsRepository.findCalendar(userId, year, month);
    return stats.map(serializeDailyFocusStat);
};
