import { prisma } from '../lib/prisma.js';

export async function createUserWithSettings(id: string, loginId: string, nickname: string) {
    return prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: { id, loginId, nickname },
        });
        await tx.userSetting.create({
            data: { userId: user.id },
        });
        return user;
    });
}

export async function findUserByLoginId(loginId: string) {
    return prisma.user.findUnique({ where: { loginId } });
}
