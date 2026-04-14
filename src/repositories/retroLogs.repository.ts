import { Prisma, PrismaClient, type RetroLog } from '@prisma/client';

import { prisma } from '../lib/prisma.js';

type Db = Pick<PrismaClient, 'retroLog' | 'dailyFocusStat'>;

export function toIsoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

export async function findDailyLogOwnedByUser(dailyLogId: string, userId: string) {
    return prisma.dailyLog.findFirst({
        where: { id: dailyLogId, userId },
    });
}

export async function findRetroByUserDateAndTemplate(
    userId: string,
    retroDate: Date,
    templateType: string,
    db: Db = prisma
): Promise<RetroLog | null> {
    return db.retroLog.findFirst({
        where: { userId, retroDate, templateType },
    });
}

export async function countRetrosByUserAndDate(userId: string, retroDate: Date, db: Db = prisma): Promise<number> {
    return db.retroLog.count({
        where: { userId, retroDate },
    });
}

export async function findRetroByUserAndDailyLogId(userId: string, dailyLogId: string): Promise<RetroLog | null> {
    return prisma.retroLog.findFirst({
        where: { userId, dailyLogId },
    });
}

export async function findRetrosByUserAndDate(userId: string, retroDate: Date): Promise<RetroLog[]> {
    return prisma.retroLog.findMany({
        where: { userId, retroDate },
        orderBy: [{ createdAt: 'asc' }, { templateType: 'asc' }],
    });
}

export async function findRetroById(id: string): Promise<RetroLog | null> {
    return prisma.retroLog.findUnique({ where: { id } });
}

export async function createRetro(
    data: {
        userId: string;
        dailyLogId: string | null;
        retroDate: Date;
        templateType: string;
        content: Prisma.InputJsonValue;
    },
    db: Db = prisma
): Promise<RetroLog> {
    return db.retroLog.create({
        data: {
            userId: data.userId,
            dailyLogId: data.dailyLogId,
            retroDate: data.retroDate,
            templateType: data.templateType,
            content: data.content,
        },
    });
}

export async function updateRetro(
    id: string,
    data: {
        content?: Prisma.InputJsonValue;
        isDirty?: boolean;
        draftContent?: Prisma.InputJsonValue | null;
    }
): Promise<RetroLog> {
    const patch: Prisma.RetroLogUpdateInput = {};
    if (data.content !== undefined) patch.content = data.content;
    if (data.isDirty !== undefined) patch.isDirty = data.isDirty;
    if (data.draftContent !== undefined) {
        patch.draftContent = data.draftContent === null ? Prisma.DbNull : data.draftContent;
    }
    return prisma.retroLog.update({
        where: { id },
        data: patch,
    });
}

export async function deleteRetro(id: string, db: Db = prisma): Promise<void> {
    await db.retroLog.delete({ where: { id } });
}

export async function upsertDailyFocusStatHasRetro(
    userId: string,
    focusDate: Date,
    hasRetroLog: boolean,
    db: Db = prisma
) {
    const existing = await db.dailyFocusStat.findFirst({
        where: { userId, focusDate },
    });
    if (existing) {
        return db.dailyFocusStat.update({
            where: { id: existing.id },
            data: { hasRetroLog },
        });
    }
    return db.dailyFocusStat.create({
        data: {
            userId,
            focusDate,
            hasRetroLog,
        },
    });
}

/** content JSON 문자열 기반 ILIKE 검색 (스키마 변경 없음) */
export async function searchRetroIdsByContent(userId: string, q: string): Promise<string[]> {
    const pattern = `%${q}%`;
    const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT id::text AS id
    FROM retro_logs
    WHERE user_id = ${userId}::uuid
      AND content::text ILIKE ${pattern}
  `);
    return rows.map((r) => r.id);
}

export async function findRetrosByIds(userId: string, ids: string[]): Promise<RetroLog[]> {
    if (ids.length === 0) return [];
    return prisma.retroLog.findMany({
        where: { userId, id: { in: ids } },
        orderBy: { retroDate: 'desc' },
    });
}

export async function countDistinctRetroDatesByUser(userId: string): Promise<number> {
    const rows = await prisma.$queryRaw<{ count: bigint | number | string }[]>(Prisma.sql`
    SELECT COUNT(DISTINCT retro_date) AS count
    FROM retro_logs
    WHERE user_id = ${userId}::uuid
  `);

    const value = rows[0]?.count;
    if (typeof value === 'bigint') return Number(value);
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value);
    return 0;
}

export async function findRetroDatesByUser(userId: string, skip: number, take: number): Promise<Date[]> {
    const rows = await prisma.retroLog.groupBy({
        by: ['retroDate'],
        where: { userId },
        orderBy: { retroDate: 'desc' },
        skip,
        take,
    });
    return rows.map((row) => row.retroDate);
}

export async function findRetroListRowsByUserAndDates(userId: string, retroDates: Date[]): Promise<RetroLog[]> {
    if (retroDates.length === 0) return [];

    return prisma.retroLog.findMany({
        where: { userId, retroDate: { in: retroDates } },
        orderBy: [{ retroDate: 'desc' }, { createdAt: 'desc' }],
    });
}
