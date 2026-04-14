import { apiClient } from '@/api/client';
import type { AdminServerDetails, AdminServerListItem } from '@/types/admin';

export const adminServersApi = {
    listServers: (params: { limit: number; offset: number; search?: string }) =>
        apiClient
            .get<AdminServerListItem[]>('/api/v1/admin/servers', { params })
            .then((r) => r.data),

    deleteServer: (serverId: string) =>
        apiClient
            .delete<{ message: string }>(`/api/v1/admin/servers/${serverId}`)
            .then((r) => r.data),

    restoreServer: (serverId: string) =>
        apiClient
            .post<{
                message: string;
            }>(`/api/v1/admin/servers/${serverId}/restore`)
            .then((r) => r.data),

    getServerDetails: (serverId: string) =>
        apiClient
            .get<AdminServerDetails>(`/api/v1/admin/servers/${serverId}`)
            .then((r) => r.data),

    getServerInvites: (serverId: string) =>
        apiClient
            .get<unknown[]>(`/api/v1/admin/servers/${serverId}/invites`)
            .then((r) => r.data),

    deleteServerInvite: (serverId: string, inviteId: string) =>
        apiClient
            .delete<{
                message: string;
            }>(`/api/v1/admin/servers/${serverId}/invites/${inviteId}`)
            .then((r) => r.data),

    verifyServer: (serverId: string) =>
        apiClient
            .post<{
                verified: boolean;
            }>(`/api/v1/admin/servers/${serverId}/verify`)
            .then((r) => r.data),

    unverifyServer: (serverId: string) =>
        apiClient
            .delete<{
                verified: boolean;
            }>(`/api/v1/admin/servers/${serverId}/verify`)
            .then((r) => r.data),

    getAwaitingReviewServers: (params: { limit: number; offset: number }) =>
        apiClient
            .get<{
                items: AdminServerListItem[];
                total: number;
            }>('/api/v1/admin/servers/awaiting-review', { params })
            .then((r) => r.data),

    declineVerification: (serverId: string) =>
        apiClient
            .delete<{
                message: string;
            }>(`/api/v1/admin/servers/${serverId}/verification`)
            .then((r) => r.data),
};
