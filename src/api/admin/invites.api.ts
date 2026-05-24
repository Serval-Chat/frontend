import { apiClient } from '@/api/client';

export const adminInvitesApi = {
    getInvites: () =>
        apiClient.get<string[]>('/api/v1/admin/invites').then((r) => r.data),

    createInvite: () =>
        apiClient
            .post<{ message: string; token: string }>('/api/v1/admin/invites')
            .then((r) => r.data),

    deleteInvite: async (token: string): Promise<void> => {
        await apiClient.delete(`/api/v1/admin/invites/${token}`);
    },

    createBatchInvites: (count: number) =>
        apiClient
            .post<{
                message: string;
                tokens: string[];
            }>('/api/v1/admin/invites/batch', { count })
            .then((r) => r.data),

    getExportInvitesUrl: () => '/api/v1/admin/invites/export',
};
