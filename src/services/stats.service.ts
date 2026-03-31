import * as statsRepository from '../repositories/stats.repository.js';

// 스트릭 계산 함수
const calculateStreak = (focusDates: Date[]): number => {
    if (focusDates.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateSet = new Set(focusDates.map((d) => d.toISOString().split('T')[0]));

    let streak = 0;
    const current = new Date(today);

    while (true) {
        const dateStr = current.toISOString().split('T')[0];
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
    return statsRepository.findHeatmapSummary(userId);
};

// 히트맵 데이터
export const getHeatmap = async (userId: string) => {
    return statsRepository.findHeatmap(userId);
};

// 달력 데이터
export const getCalendar = async (userId: string, year: number, month: number) => {
    if (month < 1 || month > 12) {
        const err = new Error('month는 1~12 사이여야 합니다.') as any;
        err.code = 'VALIDATION_ERROR';
        err.field = 'month';
        throw err;
    }

    return statsRepository.findCalendar(userId, year, month);
};
