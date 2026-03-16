import { apiClient } from '@/api/client';

export const adminInvitesApi = {
    getInvites: () =>
        apiClient.get<string[]>('/api/v1/admin/invites').then((r) => r.data),

    createInvite: () =>
        apiClient
            .post<{ message: string; token: string }>('/api/v1/admin/invites')
            .then((r) => r.data),

    deleteInvite: (token: string) =>
        apiClient
            .delete<{ message: string }>(`/api/v1/admin/invites/${token}`)
            .then((r) => r.data),
};
