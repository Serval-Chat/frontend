import { apiClient as api } from '@/api/client';

import type { CreateWebhookRequest, Webhook } from './webhooks.types';

export const getWebhooks = async (
    serverId: string,
    channelId: string,
): Promise<Webhook[]> => {
    const response = await api.get<Webhook[]>(
        `/api/v1/servers/${serverId}/channels/${channelId}/webhooks`,
    );
    return response.data;
};

export const createWebhook = async (
    serverId: string,
    channelId: string,
    data: CreateWebhookRequest,
): Promise<Webhook> => {
    const response = await api.post<Webhook>(
        `/api/v1/servers/${serverId}/channels/${channelId}/webhooks`,
        data,
    );
    return response.data;
};

export const deleteWebhook = async (
    serverId: string,
    channelId: string,
    webhookId: string,
): Promise<void> => {
    await api.delete(
        `/api/v1/servers/${serverId}/channels/${channelId}/webhooks/${webhookId}`,
    );
};
