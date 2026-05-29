import { apiClient } from '@/api/client';
import type { ServerInvite } from '@/api/invites/invites.types';
import type {
    AdminServerDetails,
    AdminServerListItem,
    AdminServerVerificationStats,
} from '@/types/admin';

export const adminServersApi = {
    listServers: (params: {
        limit: number;
        offset: number;
        search?: string;
    }): Promise<AdminServerListItem[]> =>
        apiClient
            .get<AdminServerListItem[]>('/api/v1/admin/servers', { params })
            .then((r): AdminServerListItem[] => r.data),

    getVerificationStats: (): Promise<AdminServerVerificationStats> =>
        apiClient
            .get<AdminServerVerificationStats>(
                '/api/v1/admin/servers/verification',
            )
            .then((r): AdminServerVerificationStats => r.data),

    runVerificationNow: (): Promise<AdminServerVerificationStats> =>
        apiClient
            .post<AdminServerVerificationStats>(
                '/api/v1/admin/servers/verification/run',
            )
            .then((r): AdminServerVerificationStats => r.data),

    deleteServer: async (serverId: string): Promise<void> => {
        await apiClient.delete(`/api/v1/admin/servers/${serverId}`);
    },

    restoreServer: async (serverId: string): Promise<void> => {
        await apiClient.post(`/api/v1/admin/servers/${serverId}/restore`);
    },

    getServerDetails: (serverId: string): Promise<AdminServerDetails> =>
        apiClient
            .get<AdminServerDetails>(`/api/v1/admin/servers/${serverId}`)
            .then((r): AdminServerDetails => r.data),

    getServerInvites: (serverId: string): Promise<ServerInvite[]> =>
        apiClient
            .get<ServerInvite[]>(`/api/v1/admin/servers/${serverId}/invites`)
            .then((r): ServerInvite[] => r.data),

    deleteServerInvite: async (
        serverId: string,
        inviteId: string,
    ): Promise<void> => {
        await apiClient.delete(
            `/api/v1/admin/servers/${serverId}/invites/${inviteId}`,
        );
    },

    verifyServer: (serverId: string): Promise<{ verified: boolean }> =>
        apiClient
            .post<{
                verified: boolean;
            }>(`/api/v1/admin/servers/${serverId}/verify`)
            .then((r): { verified: boolean } => r.data),

    unverifyServer: (serverId: string): Promise<{ verified: boolean }> =>
        apiClient
            .delete<{
                verified: boolean;
            }>(`/api/v1/admin/servers/${serverId}/verify`)
            .then((r): { verified: boolean } => r.data),

    setVerificationOverride: (
        serverId: string,
        override: 'verified' | 'unverified' | null,
    ): Promise<{
        verified: boolean;
        override: 'verified' | 'unverified' | null;
    }> =>
        apiClient
            .put<{
                verified: boolean;
                override: 'verified' | 'unverified' | null;
            }>(`/api/v1/admin/servers/${serverId}/verification-override`, {
                override,
            })
            .then(
                (
                    r,
                ): {
                    verified: boolean;
                    override: 'verified' | 'unverified' | null;
                } => r.data,
            ),

    getAwaitingReviewServers: (params: {
        limit: number;
        offset: number;
    }): Promise<{ items: AdminServerListItem[]; total: number }> =>
        apiClient
            .get<{
                items: AdminServerListItem[];
                total: number;
            }>('/api/v1/admin/servers/awaiting-review', { params })
            .then(
                (r): { items: AdminServerListItem[]; total: number } => r.data,
            ),

    declineVerification: (serverId: string): Promise<{ message: string }> =>
        apiClient
            .delete<{
                message: string;
            }>(`/api/v1/admin/servers/${serverId}/verification`)
            .then((r): { message: string } => r.data),
};
