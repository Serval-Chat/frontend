import { apiClient } from '@/api/client';

import type { DmChannel } from './channels.types';

export const channelsApi = {
    /**
     * @description Get or create the DM channel with a recipient
     */
    getOrCreateDm: async (recipientId: string): Promise<DmChannel> => {
        const response = await apiClient.post<DmChannel>(
            '/api/v1/users/@me/channels',
            { recipientId },
        );
        return response.data;
    },
};
