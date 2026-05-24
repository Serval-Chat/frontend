import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { botsApi } from '@/api/developer/bots.api';
import type {
    Bot,
    BotPermissions,
    CreateBotPayload,
    CreateBotResponse,
    PublicBotInfo,
    ResetSecretResponse,
} from '@/types/bot';

export const usePublicBotInfo = (
    clientId: string,
): UseQueryResult<PublicBotInfo, Error> =>
    useQuery<PublicBotInfo>({
        queryKey: ['bot-public', clientId],
        queryFn: () => botsApi.getPublicInfo(clientId),
        enabled: !!clientId,
    });

export const useBots = (): UseQueryResult<Bot[], Error> =>
    useQuery<Bot[]>({
        queryKey: ['dev-bots'],
        queryFn: () => botsApi.list(),
    });

export const useBot = (clientId: string): UseQueryResult<Bot, Error> =>
    useQuery<Bot>({
        queryKey: ['dev-bot', clientId],
        queryFn: () => botsApi.get(clientId),
        enabled: !!clientId,
    });

export const useCreateBot = (): UseMutationResult<
    CreateBotResponse,
    Error,
    CreateBotPayload
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => botsApi.create(payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['dev-bots'] });
        },
    });
};

export const useUpdateBot = (): UseMutationResult<
    Bot,
    Error,
    {
        clientId: string;
        patch: {
            name?: string;
            description?: string;
            avatar?: string;
            bannerColor?: string | null;
        };
    }
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, patch }) => botsApi.update(clientId, patch),
        onSuccess: (_, { clientId }) => {
            void queryClient.invalidateQueries({ queryKey: ['dev-bots'] });
            void queryClient.invalidateQueries({
                queryKey: ['dev-bot', clientId],
            });
        },
    });
};

export const useUploadBotPicture = (): UseMutationResult<
    { message: string; profilePicture: string },
    Error,
    { clientId: string; file: File }
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, file }) =>
            botsApi.uploadPicture(clientId, file),
        onSuccess: (_, { clientId }) => {
            void queryClient.invalidateQueries({
                queryKey: ['dev-bot', clientId],
            });
        },
    });
};

export const useUploadBotBanner = (): UseMutationResult<
    { message: string; banner: string },
    Error,
    { clientId: string; file: File }
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, file }) =>
            botsApi.uploadBanner(clientId, file),
        onSuccess: (_, { clientId }) => {
            void queryClient.invalidateQueries({
                queryKey: ['dev-bot', clientId],
            });
        },
    });
};

export const useUpdateBotPermissions = (): UseMutationResult<
    Bot,
    Error,
    { clientId: string; permissions: Partial<BotPermissions> }
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, permissions }) =>
            botsApi.updatePermissions(clientId, permissions),
        onSuccess: (_, { clientId }) => {
            void queryClient.invalidateQueries({ queryKey: ['dev-bots'] });
            void queryClient.invalidateQueries({
                queryKey: ['dev-bot', clientId],
            });
        },
    });
};

export const useDeleteBot = (): UseMutationResult<
    void,
    Error,
    { clientId: string }
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId }) => botsApi.delete(clientId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['dev-bots'] });
        },
    });
};

export const useResetBotSecret = (): UseMutationResult<
    ResetSecretResponse,
    Error,
    { clientId: string }
> =>
    useMutation({
        mutationFn: ({ clientId }) => botsApi.resetSecret(clientId),
    });

export const useResetBotToken = (): UseMutationResult<
    { token: string },
    Error,
    { clientId: string }
> =>
    useMutation({
        mutationFn: ({ clientId }) => botsApi.resetToken(clientId),
    });

export const useBotServers = (
    clientId: string,
): UseQueryResult<{ count: number }, Error> =>
    useQuery<{ count: number }>({
        queryKey: ['dev-bot-servers', clientId],
        queryFn: () => botsApi.getServers(clientId),
        enabled: !!clientId,
    });

export const useAuthorizeBot = (): UseMutationResult<
    { serverId: string; serverName: string },
    Error,
    { clientId: string; serverId: string; permissions?: number }
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, serverId, permissions }) =>
            botsApi.authorize(clientId, serverId, permissions),
        onSuccess: (_, { clientId }) => {
            void queryClient.invalidateQueries({
                queryKey: ['dev-bot-servers', clientId],
            });
        },
    });
};
