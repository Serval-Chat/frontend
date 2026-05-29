import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import {
    type AdminBan,
    type AdminBanHistoryItem,
    type AdminBansDiagnostic,
    type AdminMute,
    adminBansApi,
} from '@/api/admin/bans.api';
import { useToast } from '@/ui/components/common/Toast';
import { extractApiError } from '@/utils/extractApiError';

export const adminBansKeys = {
    all: ['admin', 'bans'] as const,
    diagnostic: (): readonly ['admin', 'bans', 'diagnostic'] =>
        [...adminBansKeys.all, 'diagnostic'] as const,
    list: (
        limit: number,
        offset: number,
    ): readonly ['admin', 'bans', 'list', number, number] =>
        [...adminBansKeys.all, 'list', limit, offset] as const,
    mutesList: (
        limit: number,
        offset: number,
    ): readonly ['admin', 'bans', 'mutes', 'list', number, number] =>
        [...adminBansKeys.all, 'mutes', 'list', limit, offset] as const,
    userBans: (
        userId: string,
    ): readonly ['admin', 'bans', 'user', string, 'bans'] =>
        [...adminBansKeys.all, 'user', userId, 'bans'] as const,
    userMutes: (
        userId: string,
    ): readonly ['admin', 'bans', 'user', string, 'mutes'] =>
        [...adminBansKeys.all, 'user', userId, 'mutes'] as const,
};

export const useAdminBansDiagnostic = (): UseQueryResult<
    AdminBansDiagnostic,
    Error
> =>
    useQuery({
        queryKey: adminBansKeys.diagnostic(),
        queryFn: (): Promise<AdminBansDiagnostic> =>
            adminBansApi.getBansDiagnostic(),
    });

export const useAdminBansList = (
    limit: number = 50,
    offset: number = 0,
): UseQueryResult<AdminBan[], Error> =>
    useQuery({
        queryKey: adminBansKeys.list(limit, offset),
        queryFn: (): Promise<AdminBan[]> =>
            adminBansApi.listBans(limit, offset),
    });

export const useAdminMutesList = (
    limit: number = 50,
    offset: number = 0,
): UseQueryResult<AdminMute[], Error> =>
    useQuery({
        queryKey: adminBansKeys.mutesList(limit, offset),
        queryFn: (): Promise<AdminMute[]> =>
            adminBansApi.listMutes(limit, offset),
    });

export const useAdminUserBans = (
    userId: string | undefined,
): UseQueryResult<AdminBanHistoryItem[], Error> =>
    useQuery({
        queryKey: adminBansKeys.userBans(userId!),
        queryFn: (): Promise<AdminBanHistoryItem[]> =>
            adminBansApi.getUserBans(userId!),
        enabled: !!userId,
    });

export const useAdminUserMutes = (
    userId: string | undefined,
): UseQueryResult<AdminBanHistoryItem[], Error> =>
    useQuery({
        queryKey: adminBansKeys.userMutes(userId!),
        queryFn: (): Promise<AdminBanHistoryItem[]> =>
            adminBansApi.getUserMutes(userId!),
        enabled: !!userId,
    });

export const useAdminBanUser = (): UseMutationResult<
    AdminBan,
    Error,
    { userId: string; reason: string; duration: number }
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: ({
            userId,
            reason,
            duration,
        }: {
            userId: string;
            reason: string;
            duration: number;
        }): Promise<AdminBan> => adminBansApi.banUser(userId, reason, duration),
        onSuccess: (_, variables): void => {
            void queryClient.invalidateQueries({
                queryKey: adminBansKeys.userBans(variables.userId),
            });
            void queryClient.invalidateQueries({ queryKey: adminBansKeys.all });
            void queryClient.invalidateQueries({
                queryKey: ['admin-user-detail', variables.userId],
            });
            void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            showToast('User banned successfully', 'success');
        },
        onError: (error): void => {
            showToast(extractApiError(error, 'Failed to ban user'), 'error');
        },
    });
};

export const useAdminUnbanUser = (): UseMutationResult<
    { message: string },
    Error,
    string
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (userId: string): Promise<{ message: string }> =>
            adminBansApi.unbanUser(userId),
        onSuccess: (_, userId): void => {
            void queryClient.invalidateQueries({
                queryKey: adminBansKeys.userBans(userId),
            });
            void queryClient.invalidateQueries({ queryKey: adminBansKeys.all });
            void queryClient.invalidateQueries({
                queryKey: ['admin-user-detail', userId],
            });
            void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            showToast('User unbanned successfully', 'success');
        },
        onError: (error): void => {
            showToast(extractApiError(error, 'Failed to unban user'), 'error');
        },
    });
};

export const useAdminMuteUser = (): UseMutationResult<
    AdminMute,
    Error,
    { userId: string; reason: string; duration: number }
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: ({
            userId,
            reason,
            duration,
        }: {
            userId: string;
            reason: string;
            duration: number;
        }): Promise<AdminMute> =>
            adminBansApi.muteUser(userId, reason, duration),
        onSuccess: (_, variables): void => {
            void queryClient.invalidateQueries({
                queryKey: adminBansKeys.userMutes(variables.userId),
            });
            void queryClient.invalidateQueries({ queryKey: adminBansKeys.all });
            void queryClient.invalidateQueries({
                queryKey: ['admin-user-detail', variables.userId],
            });
            void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            showToast('User muted successfully', 'success');
        },
        onError: (error): void => {
            showToast(extractApiError(error, 'Failed to mute user'), 'error');
        },
    });
};

export const useAdminUnmuteUser = (): UseMutationResult<
    { message: string },
    Error,
    string
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (userId: string): Promise<{ message: string }> =>
            adminBansApi.unmuteUser(userId),
        onSuccess: (_, userId): void => {
            void queryClient.invalidateQueries({
                queryKey: adminBansKeys.userMutes(userId),
            });
            void queryClient.invalidateQueries({ queryKey: adminBansKeys.all });
            void queryClient.invalidateQueries({
                queryKey: ['admin-user-detail', userId],
            });
            void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            showToast('User unmuted successfully', 'success');
        },
        onError: (error): void => {
            showToast(extractApiError(error, 'Failed to unmute user'), 'error');
        },
    });
};
