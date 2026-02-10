import { apiClient } from '@/api/client';

import type {
    CreateInviteData,
    InviteDetails,
    ServerInvite,
} from './invites.types';

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

    getServerInvites: async (serverId: string): Promise<ServerInvite[]> => {
        const response = await apiClient.get<ServerInvite[]>(
            `/api/v1/servers/${serverId}/invites`,
        );
        return response.data;
    },

    createInvite: async (
        serverId: string,
        data: CreateInviteData,
    ): Promise<ServerInvite> => {
        const response = await apiClient.post<ServerInvite>(
            `/api/v1/servers/${serverId}/invites`,
            data,
        );
        return response.data;
    },

    deleteInvite: async (
        serverId: string,
        inviteId: string,
    ): Promise<{ message: string }> => {
        const response = await apiClient.delete<{ message: string }>(
            `/api/v1/servers/${serverId}/invites/${inviteId}`,
        );
        return response.data;
    },
};
