import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 유저 ID로 유저 조회
export async function findUserById(id: string) {
    return prisma.user.findUnique({
        where: { id },
    });
}

// 유저 정보 수정 (nickname, avatarUrl)
export async function updateUser(id: string, data: { nickname?: string; avatarUrl?: string }) {
    return prisma.user.update({
        where: { id },
        data,
    });
}

// 유저 ID로 설정 조회
export async function findSettingByUserId(userId: string) {
    return prisma.userSetting.findUnique({
        where: { userId },
    });
}

// 유저 설정 수정
export async function updateSetting(
    userId: string,
    data: {
        focusMin?: number;
        shortBreakMin?: number;
        longBreakMin?: number;
        sessionsPerSet?: number;
        autoCarryTodo?: boolean;
    }
) {
    return prisma.userSetting.update({
        where: { userId },
        data,
    });
}

// 유저 삭제 (Cascade로 연관 데이터 자동 삭제)
export async function deleteUser(id: string) {
    return prisma.user.delete({
        where: { id },
    });
}
