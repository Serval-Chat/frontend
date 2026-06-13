import axios from 'axios';

import { apiClient } from '@/api/client';
import type {
    Bot,
    BotPermissions,
    CreateBotPayload,
    CreateBotResponse,
    PublicBotInfo,
} from '@/types/bot';

export const botsApi = {
    getPublicInfo: (clientId: string): Promise<PublicBotInfo> =>
        axios
            .get<PublicBotInfo>(`/api/v1/bots/${clientId}/public`)
            .then((r): PublicBotInfo => r.data),

    list: (): Promise<Bot[]> =>
        apiClient.get<Bot[]>('/api/v1/bots').then((r): Bot[] => r.data),

    get: (clientId: string): Promise<Bot> =>
        apiClient.get<Bot>(`/api/v1/bots/${clientId}`).then((r): Bot => r.data),

    create: (payload: CreateBotPayload): Promise<CreateBotResponse> =>
        apiClient
            .post<CreateBotResponse>('/api/v1/bots', payload)
            .then((r): CreateBotResponse => r.data),

    update: (
        clientId: string,
        patch: {
            name?: string;
            description?: string;
            avatar?: string;
            bannerColor?: string | null;
        },
    ): Promise<Bot> =>
        apiClient
            .patch<Bot>(`/api/v1/bots/${clientId}`, patch)
            .then((r): Bot => r.data),

    updatePermissions: (
        clientId: string,
        permissions: Partial<BotPermissions>,
    ): Promise<Bot> =>
        apiClient
            .patch<Bot>(`/api/v1/bots/${clientId}/permissions`, permissions)
            .then((r): Bot => r.data),

    delete: async (clientId: string): Promise<void> => {
        await apiClient.delete(`/api/v1/bots/${clientId}`);
    },

    resetToken: (clientId: string): Promise<{ token: string }> =>
        apiClient
            .post<{ token: string }>(`/api/v1/bots/${clientId}/reset-token`, {})
            .then((r): { token: string } => r.data),

    authorize: (
        clientId: string,
        serverId: string,
        permissions?: number,
    ): Promise<{ serverId: string; serverName: string }> =>
        apiClient
            .post<{
                serverId: string;
                serverName: string;
            }>(`/api/v1/bots/${clientId}/authorize`, { serverId, permissions })
            .then((r): { serverId: string; serverName: string } => r.data),

    getServers: (clientId: string): Promise<{ count: number }> =>
        apiClient
            .get<{ count: number }>(`/api/v1/bots/${clientId}/servers`)
            .then((r): { count: number } => r.data),

    uploadPicture: (
        clientId: string,
        file: File,
    ): Promise<{ message: string; profilePicture: string }> => {
        const formData = new FormData();
        formData.append('profilePicture', file);
        return apiClient
            .post<{
                message: string;
                profilePicture: string;
            }>(`/api/v1/bots/${clientId}/picture`, formData)
            .then((r): { message: string; profilePicture: string } => r.data);
    },

    uploadBanner: (
        clientId: string,
        file: File,
    ): Promise<{ message: string; banner: string }> => {
        const formData = new FormData();
        formData.append('banner', file);
        return apiClient
            .post<{
                message: string;
                banner: string;
            }>(`/api/v1/bots/${clientId}/banner`, formData)
            .then((r): { message: string; banner: string } => r.data);
    },
};
