import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { adminBotsApi } from '@/api/admin/bots.api';
import { ADMIN_CONSTANTS } from '@/constants/admin';
import type { AdminBotListItem } from '@/types/admin';

export const useAdminBots = (
    search = '',
    page = 0,
    limit: number = ADMIN_CONSTANTS.DEFAULT_PAGE_SIZE,
): UseQueryResult<AdminBotListItem[]> =>
    useQuery({
        queryKey: ['admin-bots', search, page, limit],
        queryFn: (): Promise<AdminBotListItem[]> =>
            adminBotsApi.listBots({
                search,
                limit,
                offset: page * limit,
            }),
    });

export const useAdminAwaitingReviewBots = (
    page = 0,
    limit: number = ADMIN_CONSTANTS.DEFAULT_PAGE_SIZE,
): UseQueryResult<{ items: AdminBotListItem[]; total: number }> =>
    useQuery({
        queryKey: ['admin-bots-awaiting-review', page, limit],
        queryFn: (): Promise<{ items: AdminBotListItem[]; total: number }> =>
            adminBotsApi.getAwaitingReviewBots({
                limit,
                offset: page * limit,
            }),
    });

export const useDeclineBotVerification = (): UseMutationResult<
    { message: string },
    Error,
    string
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (clientId: string): Promise<{ message: string }> =>
            adminBotsApi.declineVerification(clientId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({ queryKey: ['admin-bots'] });
            void queryClient.invalidateQueries({
                queryKey: ['admin-bots-awaiting-review'],
            });
        },
    });
};

export const useSetBotVerificationOverride = (): UseMutationResult<
    { verified: boolean; override: 'verified' | 'unverified' | null },
    Error,
    { clientId: string; override: 'verified' | 'unverified' | null }
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            clientId,
            override,
        }): Promise<{
            verified: boolean;
            override: 'verified' | 'unverified' | null;
        }> => adminBotsApi.setVerificationOverride(clientId, override),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({ queryKey: ['admin-bots'] });
            void queryClient.invalidateQueries({
                queryKey: ['admin-bots-awaiting-review'],
            });
        },
    });
};

export const useVerifyBot = (): UseMutationResult<
    { verified: boolean },
    Error,
    string
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (clientId: string): Promise<{ verified: boolean }> =>
            adminBotsApi.verifyBot(clientId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({ queryKey: ['admin-bots'] });
            void queryClient.invalidateQueries({
                queryKey: ['admin-bots-awaiting-review'],
            });
        },
    });
};

export const useUnverifyBot = (): UseMutationResult<
    { verified: boolean },
    Error,
    string
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (clientId: string): Promise<{ verified: boolean }> =>
            adminBotsApi.unverifyBot(clientId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({ queryKey: ['admin-bots'] });
            void queryClient.invalidateQueries({
                queryKey: ['admin-bots-awaiting-review'],
            });
        },
    });
};
