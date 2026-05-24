import { apiClient } from '@/api/client';
import type { ServerInvite } from '@/api/invites/invites.types';
import type {
    AdminServerDetails,
    AdminServerListItem,
    AdminServerVerificationStats,
} from '@/types/admin';

export const adminServersApi = {
    listServers: (params: { limit: number; offset: number; search?: string }) =>
        apiClient
            .get<AdminServerListItem[]>('/api/v1/admin/servers', { params })
            .then((r) => r.data),

    getVerificationStats: () =>
        apiClient
            .get<AdminServerVerificationStats>(
                '/api/v1/admin/servers/verification',
            )
            .then((r) => r.data),

    runVerificationNow: () =>
        apiClient
            .post<AdminServerVerificationStats>(
                '/api/v1/admin/servers/verification/run',
            )
            .then((r) => r.data),

    deleteServer: async (serverId: string): Promise<void> => {
        await apiClient.delete(`/api/v1/admin/servers/${serverId}`);
    },

    restoreServer: async (serverId: string): Promise<void> => {
        await apiClient.post(`/api/v1/admin/servers/${serverId}/restore`);
    },

    getServerDetails: (serverId: string) =>
        apiClient
            .get<AdminServerDetails>(`/api/v1/admin/servers/${serverId}`)
            .then((r) => r.data),

    getServerInvites: (serverId: string) =>
        apiClient
            .get<ServerInvite[]>(`/api/v1/admin/servers/${serverId}/invites`)
            .then((r) => r.data),

    deleteServerInvite: async (
        serverId: string,
        inviteId: string,
    ): Promise<void> => {
        await apiClient.delete(
            `/api/v1/admin/servers/${serverId}/invites/${inviteId}`,
        );
    },

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

    setVerificationOverride: (
        serverId: string,
        override: 'verified' | 'unverified' | null,
    ) =>
        apiClient
            .put<{
                verified: boolean;
                override: 'verified' | 'unverified' | null;
            }>(`/api/v1/admin/servers/${serverId}/verification-override`, {
                override,
            })
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
