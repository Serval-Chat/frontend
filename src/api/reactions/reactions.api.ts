import { apiClient } from '@/api/client';

import type {
    AddReactionRequest,
    ReactionsResponse,
    RemoveReactionRequest,
} from './reactions.types';

export const reactionsApi = {
    /**
     * @description Add a reaction to a DM message.
     */
    addDmReaction: async (
        messageId: string,
        data: AddReactionRequest,
    ): Promise<ReactionsResponse> => {
        const response = await apiClient.post<ReactionsResponse>(
            `/api/v1/messages/${messageId}/reactions`,
            data,
        );
        return response.data;
    },

    /**
     * @description Remove a reaction from a DM message.
     */
    removeDmReaction: async (
        messageId: string,
        data: RemoveReactionRequest,
    ): Promise<ReactionsResponse> => {
        const response = await apiClient.delete<ReactionsResponse>(
            `/api/v1/messages/${messageId}/reactions`,
            { data },
        );
        return response.data;
    },

    /**
     * @description Add a reaction to a server message.
     */
    addServerReaction: async (
        serverId: string,
        channelId: string,
        messageId: string,
        data: AddReactionRequest,
    ): Promise<ReactionsResponse> => {
        const response = await apiClient.post<ReactionsResponse>(
            `/api/v1/servers/${serverId}/channels/${channelId}/messages/${messageId}/reactions`,
            data,
        );
        return response.data;
    },

    /**
     * @description Remove a reaction from a server message.
     */
    removeServerReaction: async (
        serverId: string,
        channelId: string,
        messageId: string,
        data: RemoveReactionRequest,
    ): Promise<ReactionsResponse> => {
        const response = await apiClient.delete<ReactionsResponse>(
            `/api/v1/servers/${serverId}/channels/${channelId}/messages/${messageId}/reactions`,
            { data },
        );
        return response.data;
    },
};
