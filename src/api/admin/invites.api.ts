import { apiClient } from '@/api/client';

export const adminInvitesApi = {
    getInvites: (): Promise<string[]> =>
        apiClient
            .get<string[]>('/api/v1/admin/invites')
            .then((r): string[] => r.data),

    createInvite: (): Promise<{ message: string; token: string }> =>
        apiClient
            .post<{ message: string; token: string }>('/api/v1/admin/invites')
            .then((r): { message: string; token: string } => r.data),

    deleteInvite: async (token: string): Promise<void> => {
        await apiClient.delete(`/api/v1/admin/invites/${token}`);
    },

    createBatchInvites: (
        count: number,
    ): Promise<{ message: string; tokens: string[] }> =>
        apiClient
            .post<{
                message: string;
                tokens: string[];
            }>('/api/v1/admin/invites/batch', { count })
            .then((r): { message: string; tokens: string[] } => r.data),

    getExportInvitesUrl: (): string => '/api/v1/admin/invites/export',
};
