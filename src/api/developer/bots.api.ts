import axios from 'axios';

import { apiClient } from '@/api/client';
import type {
    Bot,
    BotPermissions,
    CreateBotPayload,
    CreateBotResponse,
    PublicBotInfo,
    ResetSecretResponse,
} from '@/types/bot';

export const botsApi = {
    getPublicInfo: (clientId: string) =>
        axios
            .get<PublicBotInfo>(`/api/v1/bots/${clientId}/public`)
            .then((r) => r.data),

    list: () => apiClient.get<Bot[]>('/api/v1/bots').then((r) => r.data),

    get: (clientId: string) =>
        apiClient.get<Bot>(`/api/v1/bots/${clientId}`).then((r) => r.data),

    create: (payload: CreateBotPayload) =>
        apiClient
            .post<CreateBotResponse>('/api/v1/bots', payload)
            .then((r) => r.data),

    update: (
        clientId: string,
        patch: {
            name?: string;
            description?: string;
            avatar?: string;
            bannerColor?: string | null;
        },
    ) =>
        apiClient
            .patch<Bot>(`/api/v1/bots/${clientId}`, patch)
            .then((r) => r.data),

    updatePermissions: (
        clientId: string,
        permissions: Partial<BotPermissions>,
    ) =>
        apiClient
            .patch<Bot>(`/api/v1/bots/${clientId}/permissions`, permissions)
            .then((r) => r.data),

    delete: async (clientId: string): Promise<void> => {
        await apiClient.delete(`/api/v1/bots/${clientId}`);
    },

    resetSecret: (clientId: string) =>
        apiClient
            .post<ResetSecretResponse>(
                `/api/v1/bots/${clientId}/reset-secret`,
                {},
            )
            .then((r) => r.data),

    resetToken: (clientId: string) =>
        apiClient
            .post<{ token: string }>(`/api/v1/bots/${clientId}/reset-token`, {})
            .then((r) => r.data),

    authorize: (clientId: string, serverId: string, permissions?: number) =>
        apiClient
            .post<{
                serverId: string;
                serverName: string;
            }>(`/api/v1/bots/${clientId}/authorize`, { serverId, permissions })
            .then((r) => r.data),

    getServers: (clientId: string) =>
        apiClient
            .get<{ count: number }>(`/api/v1/bots/${clientId}/servers`)
            .then((r) => r.data),

    uploadPicture: (clientId: string, file: File) => {
        const formData = new FormData();
        formData.append('profilePicture', file);
        return apiClient
            .post<{
                message: string;
                profilePicture: string;
            }>(`/api/v1/bots/${clientId}/picture`, formData)
            .then((r) => r.data);
    },

    uploadBanner: (clientId: string, file: File) => {
        const formData = new FormData();
        formData.append('banner', file);
        return apiClient
            .post<{
                message: string;
                banner: string;
            }>(`/api/v1/bots/${clientId}/banner`, formData)
            .then((r) => r.data);
    },
};
