import { apiClient } from '@/api/client';

import type { ChatMessage } from './chat.types';

export const chatApi = {
    /**
     * @description Fetch messages for a specific user
     */
    getUserMessages: async (
        userId: string,
        limit: number = 50,
        before?: string
    ): Promise<ChatMessage[]> => {
        const response = await apiClient.get<ChatMessage[]>(
            '/api/v1/messages',
            {
                params: { userId, limit, before },
            }
        );
        return response.data;
    },

    /**
     * @description Fetch messages for a specific channel
     */
    getChannelMessages: async (
        serverId: string,
        channelId: string,
        limit: number = 50,
        before?: string
    ): Promise<ChatMessage[]> => {
        const response = await apiClient.get<ChatMessage[]>(
            `/api/v1/servers/${serverId}/channels/${channelId}/messages`,
            {
                params: { limit, before },
            }
        );
        return response.data;
    },
};
