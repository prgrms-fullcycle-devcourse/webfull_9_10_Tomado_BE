import { PrismaClient, PomodoroSession } from '@prisma/client';

const prisma = new PrismaClient();

// 세션 생성
export const createSession = async (data: { userId: string; type: string }): Promise<PomodoroSession> => {
    return await prisma.pomodoroSession.create({
        data: {
            userId: data.userId,
            type: data.type,
            status: null as any,
            actualSec: null as any,
        },
    });
};

// 세션 단건 조회
export const findSessionById = async (id: string): Promise<PomodoroSession | null> => {
    return await prisma.pomodoroSession.findUnique({ where: { id } });
};

// 세션 종료
export const endSession = async (
    id: string,
    data: { status: string; actualSec: number; endedAt: Date }
): Promise<PomodoroSession> => {
    return await prisma.pomodoroSession.update({
        where: { id },
        data: {
            status: data.status,
            actualSec: data.actualSec,
            endedAt: data.endedAt,
        },
    });
};

// 세션 목록 조회
export const findSessinos = async (
    userId: string,
    startDate: string,
    endDate: string,
    type?: string
): Promise<PomodoroSession[]> => {
    return await prisma.pomodoroSession.findMany({
        where: {
            userId,
            focusDate: {
                gte: new Date(startDate),
                lte: new Date(endDate),
            },
            ...(type !== undefined && { type }),
        },
        orderBy: { startedAt: 'asc' },
    });
};

// daily_focus_stats upsert (focus + completed 시에만)
export const upsertDaliyFocusStat = async (userId: string, focusDate: string, actualSec: number): Promise<void> => {
    await prisma.dailyFocusStat.upsert({
        where: {
            userId_focusDate: {
                userId,
                focusDate: new Date(focusDate),
            },
        },
        create: {
            userId,
            focusDate: new Date(focusDate),
            totalFocusSec: actualSec,
            completedSessions: 1,
        },
        update: {
            totalFocusSec: { increment: actualSec },
            completedSessions: { increment: 1 },
        },
    });
};
