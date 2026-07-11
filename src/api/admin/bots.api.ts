import { apiClient } from '@/api/client';
import type { AdminBotListItem } from '@/types/admin';

export const adminBotsApi = {
    listBots: (params: {
        limit: number;
        offset: number;
        search?: string;
    }): Promise<AdminBotListItem[]> =>
        apiClient
            .get<AdminBotListItem[]>('/api/v1/admin/bots', { params })
            .then((r): AdminBotListItem[] => r.data),

    getAwaitingReviewBots: (params: {
        limit: number;
        offset: number;
    }): Promise<{ items: AdminBotListItem[]; total: number }> =>
        apiClient
            .get<{
                items: AdminBotListItem[];
                total: number;
            }>('/api/v1/admin/bots/awaiting-review', { params })
            .then((r): { items: AdminBotListItem[]; total: number } => r.data),

    declineVerification: (clientId: string): Promise<{ message: string }> =>
        apiClient
            .delete<{
                message: string;
            }>(`/api/v1/admin/bots/${clientId}/verification`)
            .then((r): { message: string } => r.data),

    setVerificationOverride: (
        clientId: string,
        override: 'verified' | 'unverified' | null,
    ): Promise<{
        verified: boolean;
        override: 'verified' | 'unverified' | null;
    }> =>
        apiClient
            .put<{
                verified: boolean;
                override: 'verified' | 'unverified' | null;
            }>(`/api/v1/admin/bots/${clientId}/verification-override`, {
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

    verifyBot: (clientId: string): Promise<{ verified: boolean }> =>
        apiClient
            .post<{
                verified: boolean;
            }>(`/api/v1/admin/bots/${clientId}/verify`)
            .then((r): { verified: boolean } => r.data),

    unverifyBot: (clientId: string): Promise<{ verified: boolean }> =>
        apiClient
            .delete<{
                verified: boolean;
            }>(`/api/v1/admin/bots/${clientId}/verify`)
            .then((r): { verified: boolean } => r.data),
};
