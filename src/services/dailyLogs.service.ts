import { serializeDailyLog } from '../lib/apiSerializers.js';
import { toIsoDateInSeoul } from '../lib/date.js';
import * as dailyLogsRepository from '../repositories/dailyLogs.repository.js';

const createError = (status: number, code: string, message: string) => {
    const error = new Error(message) as any;
    error.status = status;
    error.code = code;
    return error;
};

// 로그 요약 데이터 가공 (목록용)
const mapToSummary = (log: any) => ({
    id: log.id,
    log_date: toIsoDateInSeoul(log.logDate),
    title: log.title,
    content: log.content,
    tags: log.tags,
    has_retro_log: log.retroLogs ? log.retroLogs.length > 0 : false,
    updated_at: log.updatedAt.toISOString(),
});

// 데일리 로그 생성
export const createLog = async (
    userId: string,
    data: { log_date: string; title?: string; content: string; tags?: string[] }
) => {
    // 이미 해당 날짜에 로그가 있는지 확인
    const exists = await dailyLogsRepository.findDailyLogByDate(userId, data.log_date);
    if (exists) {
        throw createError(409, 'CONFLICT', `${data.log_date} 날짜에 이미 데일리 로그가 존재합니다.`);
    }

    const log = await dailyLogsRepository.createDailyLog({
        userId,
        logDate: data.log_date,
        title: data.title,
        content: data.content,
        tags: data.tags,
    });

    return serializeDailyLog(log);
};

// 특정 날짜 로그 조회
export const getLogByDate = async (userId: string, date: string) => {
    const log = await dailyLogsRepository.findDailyLogByDate(userId, date);
    if (!log) {
        throw createError(404, 'NOT_FOUND', `${date} 날짜의 데일리 로그가 존재하지 않습니다.`);
    }
    return serializeDailyLog(log);
};

// 기간별 목록 조회
export const getLogsInRange = async (userId: string, startDate: string, endDate: string) => {
    const logs = await dailyLogsRepository.findDailyLogsInRange(userId, startDate, endDate);
    return logs.map(mapToSummary);
};

// 전체 목록 페이징 조회 (최신순)
export const getLogsPaginated = async (userId: string, page: number, limit: number) => {
    const isAll = limit === 0;
    const skip = isAll ? undefined : (page - 1) * limit;
    const take = isAll ? undefined : limit;

    const [totalCount, logs] = await Promise.all([
        dailyLogsRepository.countDailyLogs(userId),
        dailyLogsRepository.findDailyLogsPaginated(userId, skip, take),
    ]);

    const totalPages = isAll ? 1 : Math.ceil(totalCount / limit);

    return {
        data: logs.map(mapToSummary),
        meta: {
            total_count: totalCount,
            total_pages: totalPages,
            current_page: page,
            limit: limit,
        },
    };
};

// 검색 및 가공
export const searchLogs = async (userId: string, query: string) => {
    const logs = await dailyLogsRepository.searchDailyLogs(userId, query);
    return logs.map(mapToSummary);
};

// 로그 수정
export const updateLog = async (
    userId: string,
    id: string,
    data: {
        title?: string;
        content?: string;
        tags?: string[];
        is_dirty?: boolean;
        draft_content?: string | null;
    }
) => {
    const existing = await dailyLogsRepository.findDailyLogById(id);
    if (!existing) throw createError(404, 'NOT_FOUND', '해당 로그를 찾을 수 없습니다.');
    if (existing.userId !== userId) throw createError(403, 'FORBIDDEN', '본인의 로그만 수정할 수 있습니다.');

    const updated = await dailyLogsRepository.updateDailyLog(id, {
        title: data.title,
        content: data.content,
        tags: data.tags,
        isDirty: data.is_dirty,
        draftContent: data.draft_content,
    });
    return serializeDailyLog(updated);
};

// 로그 삭제
export const deleteLog = async (userId: string, id: string) => {
    const log = await dailyLogsRepository.findDailyLogById(id);
    if (!log) throw createError(404, 'NOT_FOUND', '해당 로그를 찾을 수 없습니다.');
    if (log.userId !== userId) throw createError(403, 'FORBIDDEN', '본인의 로그만 삭제할 수 있습니다.');

    await dailyLogsRepository.deleteDailyLog(id, userId, log.logDate);
};
