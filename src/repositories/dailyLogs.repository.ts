import { PrismaClient, DailyLog } from '@prisma/client';

const prisma = new PrismaClient();

// 데일리 로그 생성 (Stat 업데이트 포함)
export const createDailyLog = async (data: {
    userId: string;
    logDate: string;
    title?: string;
    content: string;
    tags?: string[];
}): Promise<DailyLog> => {
    return await prisma.$transaction(async (tx) => {
        // 1. 데일리 로그 생성
        const log = await tx.dailyLog.create({
            data: {
                userId: data.userId,
                logDate: new Date(data.logDate),
                title: data.title ?? null,
                content: data.content,
                tags: data.tags ?? [],
                isDirty: false,
                draftContent: null,
            },
        });

        // 2. DailyFocusStat 상의 hasDailyLog 플래그 업데이트 (UPSERT)
        await tx.dailyFocusStat.upsert({
            where: {
                userId_focusDate: {
                    userId: data.userId,
                    focusDate: new Date(data.logDate),
                },
            },
            create: {
                userId: data.userId,
                focusDate: new Date(data.logDate),
                hasDailyLog: true,
            },
            update: {
                hasDailyLog: true,
            },
        });

        return log;
    });
};

// 특정 날짜의 데일리 로그 조회
export const findDailyLogByDate = async (userId: string, date: string): Promise<DailyLog | null> => {
    return await prisma.dailyLog.findFirst({
        where: {
            userId,
            logDate: new Date(date),
        },
    });
};

// 특정 ID로 데일리 로그 조회
export const findDailyLogById = async (id: string): Promise<DailyLog | null> => {
    return await prisma.dailyLog.findUnique({ where: { id } });
};

// 기간별 데일리 로그 요약 목록 조회
export const findDailyLogsInRange = async (
    userId: string,
    startDate: string,
    endDate: string
): Promise<(DailyLog & { retroLogs: { id: string }[] })[]> => {
    return (await prisma.dailyLog.findMany({
        where: {
            userId,
            logDate: {
                gte: new Date(startDate),
                lte: new Date(endDate),
            },
        },
        include: {
            retroLogs: {
                select: {
                    id: true,
                },
            },
        },
        orderBy: { logDate: 'desc' },
    })) as (DailyLog & { retroLogs: { id: string }[] })[];
};

// 전체 데일리 로그 페이징 조회 (최신순)
export const findDailyLogsPaginated = async (
    userId: string,
    skip?: number,
    take?: number
): Promise<(DailyLog & { retroLogs: { id: string }[] })[]> => {
    return (await prisma.dailyLog.findMany({
        where: { userId },
        include: {
            retroLogs: {
                select: { id: true },
            },
        },
        orderBy: { logDate: 'desc' },
        skip,
        take,
    })) as (DailyLog & { retroLogs: { id: string }[] })[];
};

// 사용자의 전체 데일리 로그 개수 조회
export const countDailyLogs = async (userId: string): Promise<number> => {
    return await prisma.dailyLog.count({
        where: { userId },
    });
};

// 검색 (제목/본문 기반)
export const searchDailyLogs = async (
    userId: string,
    query: string
): Promise<(DailyLog & { retroLogs: { id: string }[] })[]> => {
    return (await prisma.dailyLog.findMany({
        where: {
            userId,
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { content: { contains: query, mode: 'insensitive' } },
            ],
        },
        include: {
            retroLogs: {
                select: { id: true },
            },
        },
        orderBy: { logDate: 'desc' },
    })) as (DailyLog & { retroLogs: { id: string }[] })[];
};

// 데일리 로그 수정 (isDirty/draftContent 대응)
export const updateDailyLog = async (
    id: string,
    data: {
        title?: string;
        content?: string;
        tags?: string[];
        isDirty?: boolean;
        draftContent?: string | null;
    }
): Promise<DailyLog> => {
    return await prisma.dailyLog.update({
        where: { id },
        data: {
            ...data,
        },
    });
};

// 데일리 로그 삭제 (Stat 업데이트 포함)
export const deleteDailyLog = async (id: string, userId: string, logDate: Date): Promise<void> => {
    await prisma.$transaction(async (tx) => {
        // 1. 로그 삭제
        await tx.dailyLog.delete({ where: { id } });

        // 2. DailyFocusStat 상의 hasDailyLog 플래그 제거
        // (Stat 정보가 아예 없어지면 안 되므로 update만 수행)
        await tx.dailyFocusStat.updateMany({
            where: {
                userId,
                focusDate: logDate,
            },
            data: {
                hasDailyLog: false,
            },
        });
    });
};
