import { apiClient } from '@/api/client';

import type {
    ClearChannelPingsResponse,
    DeletePingResponse,
    GetPingsResponse,
} from './pings.types';

export const pingsService = {
    /**
     * Get all pings for the current user
     */
    getPings: async (): Promise<GetPingsResponse> => {
        const response = await apiClient.get<GetPingsResponse>('/api/v1/pings');
        return response.data;
    },

    /**
     * Delete a specific ping
     */
    deletePing: async (id: string): Promise<DeletePingResponse> => {
        const response = await apiClient.delete<DeletePingResponse>(
            `/api/v1/pings/${id}`,
        );
        return response.data;
    },

    /**
     * Clear all pings for a specific channel
     */
    clearChannelPings: async (
        channelId: string,
    ): Promise<ClearChannelPingsResponse> => {
        const response = await apiClient.delete<ClearChannelPingsResponse>(
            `/api/v1/pings/channel/${channelId}`,
        );
        return response.data;
    },

    /**
     * Clear all pings for the current user
     */
    clearAllPings: async (): Promise<DeletePingResponse> => {
        const response =
            await apiClient.delete<DeletePingResponse>('/api/v1/pings');
        return response.data;
    },
};
