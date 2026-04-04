import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 누적 기록 조회
export const findOverallStats = async (userId: string) => {
    const [sessionsAgg, dailyLogsCount, retroLogsCount, foucsStats] = await Promise.all([
        // 총 포모도로 세션 수 + 총 집중시간
        prisma.pomodoroSession.aggregate({
            where: { userId, type: 'focus', status: 'completed' },
            _count: { id: true },
            _sum: { actualSec: true },
        }),
        // 총 데일리로그 수
        prisma.dailyLog.count({ where: { userId } }),
        // 총 회고 수
        prisma.retroLog.count({ where: { userId } }),
        // 스트릭 계산용 날짜 목록
        prisma.dailyFocusStat.findMany({
            where: { userId },
            select: { focusDate: true },
            orderBy: { focusDate: 'desc' },
        }),
    ]);

    return {
        totalSessions: sessionsAgg._count.id,
        totalFocusSec: sessionsAgg._sum.actualSec ?? 0,
        totalDailyLogs: dailyLogsCount,
        totalRetroLogs: retroLogsCount,
        focusDates: foucsStats.map((s) => s.focusDate),
    };
};

// 히트맵 페이지 상단 통계 (최근 1년)
export const findHeatmapSummary = async (userId: string) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    const result = await prisma.dailyFocusStat.aggregate({
        where: {
            userId,
            focusDate: {
                gte: startDate,
                lte: endDate,
            },
        },
        _sum: {
            completedSessions: true,
            totalFocusSec: true,
        },
        _count: { focusDate: true },
    });

    const totalSessions = result._sum.completedSessions ?? 0;
    const totalFocusSec = result._sum.totalFocusSec ?? 0;
    const activeDays = result._count.focusDate ?? 0;

    return {
        totalSessions,
        totalFocusSec,
        dailyAvgSessions: activeDays > 0 ? Math.round((totalSessions / activeDays) * 10) / 10 : 0,
    };
};

// 히트맵 데이터 조회
export const findHeatmap = async (userId: string) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    return prisma.dailyFocusStat.findMany({
        where: {
            userId,
            focusDate: {
                gte: startDate,
                lte: endDate,
            },
        },
        orderBy: { focusDate: 'asc' },
    });
};

// 달력 데이터 조회
export const findCalendar = async (userId: string, year: number, month: number) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return prisma.dailyFocusStat.findMany({
        where: {
            userId,
            focusDate: {
                gte: startDate,
                lte: endDate,
            },
        },
        orderBy: { focusDate: 'asc' },
    });
};
