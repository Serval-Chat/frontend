import { apiClient } from '@/api/client';

import type { InviteDetails } from './invites.types';

export const invitesApi = {
    getInviteDetails: async (code: string): Promise<InviteDetails> => {
        const response = await apiClient.get<InviteDetails>(
            `/api/v1/invites/${code}`,
        );
        return response.data;
    },

    joinServer: async (code: string): Promise<{ serverId: string }> => {
        const response = await apiClient.post<{ serverId: string }>(
            `/api/v1/invites/${code}/join`,
        );
        return response.data;
    },
};
