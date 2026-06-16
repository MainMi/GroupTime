import urlEnum from '../constants/urlEnum';
import { getAccessToken } from '../helper/authToken';
import { notifyError } from '../helper/notify';
import i18n from '../i18n';

// Avatar uploads are multipart/form-data, so they can't go through fetchAuth
// (which JSON-stringifies the body). We send FormData with a raw fetch and let
// the browser set the multipart boundary — only the Authorization header is added.
const uploadAvatar = async (url, file, extraFields = {}) => {
    const token = getAccessToken();
    if (!token) {
        notifyError(i18n.t('errors.sessionExpired'));
        return { ok: false };
    }
    const form = new FormData();
    form.append('avatar', file);
    Object.entries(extraFields).forEach(([key, value]) => form.append(key, value));

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { Authorization: token },
            body: form,
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            notifyError(data?.message || i18n.t('errors.uploadImageFailed'));
            return { data, status: response.status, ok: false };
        }
        return { data, status: response.status, ok: true };
    } catch (error) {
        console.error('Avatar upload failed:', error);
        notifyError(i18n.t('errors.connectionError'));
        return { ok: false };
    }
};

// Select-active / delete are plain JSON requests (no file), but still need the
// raw-fetch path for the auth header and a consistent { data, ok } result shape.
const jsonAvatarRequest = async (url, method, body) => {
    const token = getAccessToken();
    if (!token) {
        notifyError(i18n.t('errors.sessionExpired'));
        return { ok: false };
    }
    try {
        const response = await fetch(url, {
            method,
            headers: { Authorization: token, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            notifyError(data?.message || i18n.t('errors.updatePhotoFailed'));
            return { data, status: response.status, ok: false };
        }
        return { data, status: response.status, ok: true };
    } catch (error) {
        console.error('Avatar request failed:', error);
        notifyError(i18n.t('errors.connectionError'));
        return { ok: false };
    }
};

export function uploadUserAvatar(file) {
    return uploadAvatar(urlEnum.userAvatar, file);
}

export function selectUserAvatar(fileId) {
    return jsonAvatarRequest(urlEnum.userAvatarSelect, 'POST', { fileId });
}

export function deleteUserAvatar(fileId) {
    return jsonAvatarRequest(urlEnum.userAvatar, 'DELETE', { fileId });
}

export function uploadGroupAvatar(groupId, file) {
    return uploadAvatar(urlEnum.groupAvatar, file, { groupId });
}

export function selectGroupAvatar(groupId, fileId) {
    return jsonAvatarRequest(urlEnum.groupAvatarSelect, 'POST', { groupId, fileId });
}

export function deleteGroupAvatar(groupId, fileId) {
    return jsonAvatarRequest(urlEnum.groupAvatar, 'DELETE', { groupId, fileId });
}
