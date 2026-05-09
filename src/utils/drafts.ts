export const getDraftKey = (
    userId?: string | null,
    serverId?: string | null,
    channelId?: string | null,
): string | null => {
    if (serverId && channelId) {
        return `draft:server:${serverId}:channel:${channelId}`;
    }
    if (userId) {
        return `draft:user:${userId}`;
    }
    return null;
};

export const saveDraft = (
    content: string,
    userId?: string | null,
    serverId?: string | null,
    channelId?: string | null,
): void => {
    const key = getDraftKey(userId, serverId, channelId);
    if (!key) return;
    localStorage.setItem(key, content);
};

export const getDraft = (
    userId?: string | null,
    serverId?: string | null,
    channelId?: string | null,
): string | null => {
    const key = getDraftKey(userId, serverId, channelId);
    if (!key) return null;
    return localStorage.getItem(key);
};

export const clearDraft = (
    userId?: string | null,
    serverId?: string | null,
    channelId?: string | null,
): void => {
    const key = getDraftKey(userId, serverId, channelId);
    if (!key) return;
    localStorage.removeItem(key);
};
