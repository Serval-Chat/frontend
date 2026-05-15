import { apiClient } from '@/api/client';

import type { ChatMessage } from './chat.types';

const unwrapMessages = (data: unknown): ChatMessage[] => {
    if (Array.isArray(data)) return data as ChatMessage[];
    if (data && typeof data === 'object') {
        for (const key of ['messages', 'data']) {
            const value = (data as Record<string, unknown>)[key];
            if (Array.isArray(value)) return value as ChatMessage[];
        }
    }
    return [];
};

export const chatApi = {
    /**
     * @description Fetch messages for a specific user
     */
    getUserMessages: async (
        userId: string,
        limit: number = 50,
        before?: string,
        after?: string,
    ): Promise<ChatMessage[]> => {
        const response = await apiClient.get<unknown>('/api/v1/messages', {
            params: { userId, limit, before, after },
        });
        return unwrapMessages(response.data);
    },

    /**
     * @description Fetch messages for a specific channel
     */
    getChannelMessages: async (
        serverId: string,
        channelId: string,
        limit: number = 50,
        before?: string,
        around?: string,
        after?: string,
    ): Promise<ChatMessage[]> => {
        const response = await apiClient.get<unknown>(
            `/api/v1/servers/${serverId}/channels/${channelId}/messages`,
            {
                params: { limit, before, around, after },
            },
        );
        return unwrapMessages(response.data);
    },
    /**
     * @description Delete a message from a channel
     */
    deleteMessage: async (
        serverId: string,
        channelId: string,
        messageId: string,
    ): Promise<void> => {
        await apiClient.delete(
            `/api/v1/servers/${serverId}/channels/${channelId}/messages/${messageId}`,
        );
    },

    /**
     * @description Edit a message in a channel
     */
    editChannelMessage: async (
        serverId: string,
        channelId: string,
        messageId: string,
        content: string,
    ): Promise<ChatMessage> => {
        const response = await apiClient.patch<ChatMessage>(
            `/api/v1/servers/${serverId}/channels/${channelId}/messages/${messageId}`,
            { content },
        );
        return response.data;
    },

    /**
     * @description Edit a direct message
     */
    editUserMessage: async (
        messageId: string,
        content: string,
    ): Promise<ChatMessage> => {
        const response = await apiClient.patch<ChatMessage>(
            `/api/v1/messages/${messageId}`,
            { content },
        );
        return response.data;
    },

    /**
     * @description Toggle message pin
     */
    togglePin: async (
        serverId: string,
        channelId: string,
        messageId: string,
    ): Promise<ChatMessage> => {
        const response = await apiClient.post<ChatMessage>(
            `/api/v1/servers/${serverId}/channels/${channelId}/messages/${messageId}/pin`,
        );
        return response.data;
    },

    /**
     * @description Toggle message sticky
     */
    toggleSticky: async (
        serverId: string,
        channelId: string,
        messageId: string,
    ): Promise<ChatMessage> => {
        const response = await apiClient.post<ChatMessage>(
            `/api/v1/servers/${serverId}/channels/${channelId}/messages/${messageId}/sticky`,
        );
        return response.data;
    },

    /**
     * @description Fetch all pinned messages for a channel
     */
    getPinnedMessages: async (
        serverId: string,
        channelId: string,
    ): Promise<ChatMessage[]> => {
        const response = await apiClient.get<unknown>(
            `/api/v1/servers/${serverId}/channels/${channelId}/messages/pins`,
        );
        return unwrapMessages(response.data);
    },

    /**
     * @description Fetch unread DM counts for all peers
     */
    getUnreadCounts: async (): Promise<Record<string, number>> => {
        const response = await apiClient.get<{
            counts: Record<string, number>;
        }>('/api/v1/messages/unread');
        return response.data.counts;
    },

    /**
     * @description Vote on a DM poll
     */
    votePollDm: async (
        messageId: string,
        optionIds: string[],
    ): Promise<ChatMessage> => {
        const response = await apiClient.post<ChatMessage>(
            `/api/v1/messages/${messageId}/poll/vote`,
            { optionIds },
        );
        return response.data;
    },

    /**
     * @description Vote on a Server poll
     */
    votePollServer: async (
        serverId: string,
        channelId: string,
        messageId: string,
        optionIds: string[],
    ): Promise<ChatMessage> => {
        const response = await apiClient.post<ChatMessage>(
            `/api/v1/servers/${serverId}/channels/${channelId}/messages/${messageId}/poll/vote`,
            { optionIds },
        );
        return response.data;
    },
};
