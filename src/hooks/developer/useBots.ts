import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { botsApi } from '@/api/developer/bots.api';
import type {
    Bot,
    BotPermissions,
    CreateBotPayload,
    CreateBotResponse,
    PublicBotInfo,
} from '@/types/bot';

export const usePublicBotInfo = (
    clientId: string,
): UseQueryResult<PublicBotInfo> =>
    useQuery<PublicBotInfo>({
        queryKey: ['bot-public', clientId],
        queryFn: (): Promise<PublicBotInfo> => botsApi.getPublicInfo(clientId),
        enabled: !!clientId,
    });

export const useBots = (): UseQueryResult<Bot[]> =>
    useQuery<Bot[]>({
        queryKey: ['dev-bots'],
        queryFn: (): Promise<Bot[]> => botsApi.list(),
    });

export const useBot = (clientId: string): UseQueryResult<Bot> =>
    useQuery<Bot>({
        queryKey: ['dev-bot', clientId],
        queryFn: (): Promise<Bot> => botsApi.get(clientId),
        enabled: !!clientId,
    });

export const useCreateBot = (): UseMutationResult<
    CreateBotResponse,
    Error,
    CreateBotPayload
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload): Promise<CreateBotResponse> =>
            botsApi.create(payload),
        onSuccess: (): void => {
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
        mutationFn: ({ clientId, patch }): Promise<Bot> =>
            botsApi.update(clientId, patch),
        onSuccess: (_, { clientId }): void => {
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
        mutationFn: ({
            clientId,
            file,
        }): Promise<{ message: string; profilePicture: string }> =>
            botsApi.uploadPicture(clientId, file),
        onSuccess: (_, { clientId }): void => {
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
        mutationFn: ({
            clientId,
            file,
        }): Promise<{ message: string; banner: string }> =>
            botsApi.uploadBanner(clientId, file),
        onSuccess: (_, { clientId }): void => {
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
        mutationFn: ({ clientId, permissions }): Promise<Bot> =>
            botsApi.updatePermissions(clientId, permissions),
        onSuccess: (_, { clientId }): void => {
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
        mutationFn: ({ clientId }): Promise<void> => botsApi.delete(clientId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({ queryKey: ['dev-bots'] });
        },
    });
};

export const useResetBotToken = (): UseMutationResult<
    { token: string },
    Error,
    { clientId: string }
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId }): Promise<{ token: string }> =>
            botsApi.resetToken(clientId),
        onSuccess: (_, { clientId }): void => {
            void queryClient.invalidateQueries({
                queryKey: ['dev-bot', clientId],
            });
        },
    });
};

export const useBotServers = (
    clientId: string,
): UseQueryResult<{ count: number }> =>
    useQuery<{ count: number }>({
        queryKey: ['dev-bot-servers', clientId],
        queryFn: (): Promise<{ count: number }> => botsApi.getServers(clientId),
        enabled: !!clientId,
    });

export const useAuthorizeBot = (): UseMutationResult<
    { serverId: string; serverName: string },
    Error,
    { clientId: string; serverId: string; permissions?: number }
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            clientId,
            serverId,
            permissions,
        }): Promise<{ serverId: string; serverName: string }> =>
            botsApi.authorize(clientId, serverId, permissions),
        onSuccess: (_, { clientId }): void => {
            void queryClient.invalidateQueries({
                queryKey: ['dev-bot-servers', clientId],
            });
        },
    });
};
