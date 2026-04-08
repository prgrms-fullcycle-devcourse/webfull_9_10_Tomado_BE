import type { FileObject } from '@supabase/storage-js';

import { supabaseAdmin } from '../lib/supabase.js';

const avatarBucket = process.env.SUPABASE_AVATAR_BUCKET ?? 'avatars';

const getAvatarDirectory = (userId: string) => `users/${userId}`;

const sanitizeFileName = (fileName: string) => fileName.replace(/[^a-zA-Z0-9._-]/g, '-');

const withCacheBuster = (url: string, version: string) => `${url}?v=${encodeURIComponent(version)}`;

async function listAvatarFiles(userId: string) {
    const { data, error } = await supabaseAdmin.storage.from(avatarBucket).list(getAvatarDirectory(userId), {
        limit: 20,
        sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
        throw error;
    }

    return (data ?? []).filter((entry) => /\.[^./]+$/.test(entry.name));
}

function buildAvatarUrl(userId: string, file: FileObject) {
    const path = `${getAvatarDirectory(userId)}/${file.name}`;
    const publicUrl = supabaseAdmin.storage.from(avatarBucket).getPublicUrl(path).data.publicUrl;

    return withCacheBuster(publicUrl, file.updated_at ?? file.created_at ?? file.name);
}

export async function getAvatarUrl(userId: string) {
    const files = await listAvatarFiles(userId);
    const avatarFile = files[0];

    if (!avatarFile) {
        return null;
    }

    return buildAvatarUrl(userId, avatarFile);
}

export async function replaceAvatar(userId: string, file: Express.Multer.File) {
    const existingFiles = await listAvatarFiles(userId);

    if (existingFiles.length > 0) {
        const { error: removeError } = await supabaseAdmin.storage
            .from(avatarBucket)
            .remove(existingFiles.map((entry) => `${getAvatarDirectory(userId)}/${entry.name}`));

        if (removeError) {
            throw removeError;
        }
    }

    const filePath = `${getAvatarDirectory(userId)}/${Date.now()}-${sanitizeFileName(file.originalname)}`;
    const { error: uploadError } = await supabaseAdmin.storage.from(avatarBucket).upload(filePath, file.buffer, {
        cacheControl: '3600',
        contentType: file.mimetype,
        upsert: false,
    });

    if (uploadError) {
        throw uploadError;
    }

    const publicUrl = supabaseAdmin.storage.from(avatarBucket).getPublicUrl(filePath).data.publicUrl;

    return withCacheBuster(publicUrl, `${Date.now()}`);
}

export async function deleteAvatar(userId: string) {
    const existingFiles = await listAvatarFiles(userId);

    if (existingFiles.length === 0) {
        return;
    }

    const { error } = await supabaseAdmin.storage
        .from(avatarBucket)
        .remove(existingFiles.map((entry) => `${getAvatarDirectory(userId)}/${entry.name}`));

    if (error) {
        throw error;
    }
}
