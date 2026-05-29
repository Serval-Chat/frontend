import { apiClient } from '@/api/client';

export interface AdminBan {
    _id: string;
    userId: string;
    reason: string;
    issuedBy: string;
    expirationTimestamp: string;
    active: boolean;
    history?: AdminBanHistoryItem[];
}

export interface AdminMute {
    _id: string;
    userId: string;
    reason: string;
    issuedBy: string;
    expirationTimestamp: string;
    active: boolean;
    history?: AdminBanHistoryItem[];
}

export interface AdminBanHistoryItem {
    _id: string;
    reason: string;
    timestamp: string;
    expirationTimestamp: string;
    issuedBy: string;
    active: boolean;
}

export interface AdminBansDiagnostic {
    appBans: {
        count: number;
        sample: unknown[];
    };
    serverBans: {
        count: number;
        sample: unknown[];
    };
}

export const adminBansApi = {
    getBansDiagnostic: async (): Promise<AdminBansDiagnostic> => {
        const response = await apiClient.get<AdminBansDiagnostic>(
            '/api/v1/admin/bans/diagnostic',
        );
        return response.data;
    },
    listBans: async (
        limit: number = 50,
        offset: number = 0,
    ): Promise<AdminBan[]> => {
        const response = await apiClient.get<AdminBan[]>(
            `/api/v1/admin/bans?limit=${limit}&offset=${offset}`,
        );
        return response.data;
    },
    listMutes: async (
        limit: number = 50,
        offset: number = 0,
    ): Promise<AdminMute[]> => {
        const response = await apiClient.get<AdminMute[]>(
            `/api/v1/admin/mutes?limit=${limit}&offset=${offset}`,
        );
        return response.data;
    },
    getUserBans: async (userId: string): Promise<AdminBanHistoryItem[]> => {
        const response = await apiClient.get<AdminBanHistoryItem[]>(
            `/api/v1/admin/users/${userId}/bans`,
        );
        return response.data;
    },
    getUserMutes: async (userId: string): Promise<AdminBanHistoryItem[]> => {
        const response = await apiClient.get<AdminBanHistoryItem[]>(
            `/api/v1/admin/users/${userId}/mutes`,
        );
        return response.data;
    },
    banUser: async (
        userId: string,
        reason: string,
        duration: number,
    ): Promise<AdminBan> => {
        const response = await apiClient.post<AdminBan>(
            `/api/v1/admin/users/${userId}/ban`,
            {
                reason,
                duration,
            },
        );
        return response.data;
    },
    unbanUser: async (userId: string): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>(
            `/api/v1/admin/users/${userId}/unban`,
        );
        return response.data;
    },
    muteUser: async (
        userId: string,
        reason: string,
        duration: number,
    ): Promise<AdminMute> => {
        const response = await apiClient.post<AdminMute>(
            `/api/v1/admin/users/${userId}/mute`,
            {
                reason,
                duration,
            },
        );
        return response.data;
    },
    unmuteUser: async (userId: string): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>(
            `/api/v1/admin/users/${userId}/unmute`,
        );
        return response.data;
    },
};
