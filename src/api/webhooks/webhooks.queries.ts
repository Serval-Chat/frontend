import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { createWebhook, deleteWebhook, getWebhooks } from './webhooks.api';
import type { CreateWebhookRequest, Webhook } from './webhooks.types';

export const webhookKeys = {
    all: ['webhooks'] as const,
    list: (serverId: string, channelId: string) =>
        [...webhookKeys.all, 'list', serverId, channelId] as const,
};

export const useWebhooks = (
    serverId: string,
    channelId: string,
): UseQueryResult<Webhook[], Error> =>
    useQuery({
        queryKey: webhookKeys.list(serverId, channelId),
        queryFn: () => getWebhooks(serverId, channelId),
        enabled: !!serverId && !!channelId,
    });

export const useCreateWebhook = (
    serverId: string,
    channelId: string,
): UseMutationResult<Webhook, Error, CreateWebhookRequest> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateWebhookRequest) =>
            createWebhook(serverId, channelId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: webhookKeys.list(serverId, channelId),
            });
        },
    });
};

export const useDeleteWebhook = (
    serverId: string,
    channelId: string,
): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (webhookId: string) =>
            deleteWebhook(serverId, channelId, webhookId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: webhookKeys.list(serverId, channelId),
            });
        },
    });
};
