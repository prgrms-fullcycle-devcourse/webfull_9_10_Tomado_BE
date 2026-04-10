import { serializeUser, serializeUserSetting } from '../lib/apiSerializers.js';
import { supabaseAdmin } from '../lib/supabase.js';
import * as avatarService from './avatar.service.js';
import * as usersRepository from '../repositories/users.repository.js';

// 내 프로필 조회
export async function getMyProfile(userId: string) {
    const user = await usersRepository.findUserById(userId);

    if (!user) {
        throw new Error('NOT_FOUND');
    }

    const avatarUrl = await avatarService.getAvatarUrl(userId);

    return serializeUser(user, avatarUrl);
}

// 내 프로필 수정
export async function updateMyProfile(userId: string, data: { nickname?: string; avatar_url?: string }) {
    const user = await usersRepository.findUserById(userId);

    if (!user) {
        throw new Error('NOT_FOUND');
    }

    // API 명세서의 avatar_url을 Prisma 모델의 avatarUrl로 변환
    const updated = await usersRepository.updateUser(userId, {
        nickname: data.nickname,
        avatarUrl: data.avatar_url,
    });
    const avatarUrl = await avatarService.getAvatarUrl(userId);

    return serializeUser(updated, avatarUrl);
}

export async function uploadMyAvatar(userId: string, file: Express.Multer.File) {
    const user = await usersRepository.findUserById(userId);

    if (!user) {
        throw new Error('NOT_FOUND');
    }

    const avatarUrl = await avatarService.replaceAvatar(userId, file);

    return serializeUser(user, avatarUrl);
}

export async function deleteMyAvatar(userId: string) {
    const user = await usersRepository.findUserById(userId);

    if (!user) {
        throw new Error('NOT_FOUND');
    }

    await avatarService.deleteAvatar(userId);

    return serializeUser(user, null);
}

// 내 앱 설정 조회
export async function getMySettings(userId: string) {
    const settings = await usersRepository.findSettingByUserId(userId);

    if (!settings) {
        throw new Error('NOT_FOUND');
    }

    return serializeUserSetting(settings);
}

// 내 앱 설정 수정
export async function updateMySettings(
    userId: string,
    data: {
        focus_min?: number;
        short_break_min?: number;
        long_break_min?: number;
        sessions_per_set?: number;
        auto_carry_todo?: boolean;
    }
) {
    const settings = await usersRepository.findSettingByUserId(userId);

    if (!settings) {
        throw new Error('NOT_FOUND');
    }

    // API 명세서의 snake_case를 Prisma 모델의 camelCase로 변환
    const updated = await usersRepository.updateSetting(userId, {
        focusMin: data.focus_min,
        shortBreakMin: data.short_break_min,
        longBreakMin: data.long_break_min,
        sessionsPerSet: data.sessions_per_set,
        autoCarryTodo: data.auto_carry_todo,
    });
    return serializeUserSetting(updated);
}

// 회원 탈퇴
export async function deleteMyAccount(userId: string) {
    const user = await usersRepository.findUserById(userId);

    if (!user) {
        throw new Error('NOT_FOUND');
    }

    await avatarService.deleteAvatar(userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
        throw new Error('INTERNAL_ERROR');
    }

    await usersRepository.deleteUser(userId);
}
