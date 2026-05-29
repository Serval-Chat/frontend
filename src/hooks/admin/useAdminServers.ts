import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { adminServersApi } from '@/api/admin/servers.api';
import type { ServerInvite } from '@/api/invites/invites.types';
import { ADMIN_CONSTANTS } from '@/constants/admin';
import type {
    AdminServerDetails,
    AdminServerListItem,
    AdminServerVerificationStats,
} from '@/types/admin';

export const useAdminServers = (
    search: string = '',
    page: number = 0,
    limit: number = ADMIN_CONSTANTS.DEFAULT_PAGE_SIZE,
): UseQueryResult<AdminServerListItem[]> =>
    useQuery({
        queryKey: ['admin-servers', search, page, limit],
        queryFn: (): Promise<AdminServerListItem[]> =>
            adminServersApi.listServers({
                search,
                limit,
                offset: page * limit,
            }),
    });

export const useAdminServerVerificationStats =
    (): UseQueryResult<AdminServerVerificationStats> =>
        useQuery({
            queryKey: ['admin-server-verification-stats'],
            queryFn: (): Promise<AdminServerVerificationStats> =>
                adminServersApi.getVerificationStats(),
        });

export const useRunServerVerificationNow = (): UseMutationResult<
    AdminServerVerificationStats,
    Error,
    void
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (): Promise<AdminServerVerificationStats> =>
            adminServersApi.runVerificationNow(),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({ queryKey: ['admin-servers'] });
            void queryClient.invalidateQueries({
                queryKey: ['admin-server-verification-stats'],
            });
            void queryClient.invalidateQueries({
                queryKey: ['admin-servers-awaiting-review'],
            });
        },
    });
};

export const useSetServerVerificationOverride = (): UseMutationResult<
    { verified: boolean; override: 'verified' | 'unverified' | null },
    Error,
    { serverId: string; override: 'verified' | 'unverified' | null }
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            serverId,
            override,
        }): Promise<{
            verified: boolean;
            override: 'verified' | 'unverified' | null;
        }> => adminServersApi.setVerificationOverride(serverId, override),
        onSuccess: (_data, variables): void => {
            void queryClient.invalidateQueries({ queryKey: ['admin-servers'] });
            void queryClient.invalidateQueries({
                queryKey: ['admin-server-detail', variables.serverId],
            });
            void queryClient.invalidateQueries({
                queryKey: ['admin-server-verification-stats'],
            });
            void queryClient.invalidateQueries({
                queryKey: ['admin-servers-awaiting-review'],
            });
        },
    });
};

export const useDeleteServer = (): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (serverId: string): Promise<void> =>
            adminServersApi.deleteServer(serverId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({ queryKey: ['admin-servers'] });
        },
    });
};

export const useRestoreServer = (): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (serverId: string): Promise<void> =>
            adminServersApi.restoreServer(serverId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({ queryKey: ['admin-servers'] });
        },
    });
};

export const useAdminServerDetail = (
    serverId: string | null,
): UseQueryResult<AdminServerDetails> =>
    useQuery({
        queryKey: ['admin-server-detail', serverId],
        queryFn: (): Promise<AdminServerDetails> =>
            adminServersApi.getServerDetails(serverId!),
        enabled: !!serverId,
    });

export const useAdminServerInvites = (
    serverId: string | null,
): UseQueryResult<ServerInvite[]> =>
    useQuery({
        queryKey: ['admin-server-invites', serverId],
        queryFn: (): Promise<ServerInvite[]> =>
            adminServersApi.getServerInvites(serverId!),
        enabled: !!serverId,
    });

export const useDeleteAdminServerInvite = (
    serverId: string,
): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (inviteId: string): Promise<void> =>
            adminServersApi.deleteServerInvite(serverId, inviteId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: ['admin-server-invites', serverId],
            });
        },
    });
};

export const useVerifyServer = (): UseMutationResult<
    { verified: boolean },
    Error,
    string
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (serverId: string): Promise<{ verified: boolean }> =>
            adminServersApi.verifyServer(serverId),
        onSuccess: (_data, serverId): void => {
            void queryClient.invalidateQueries({ queryKey: ['admin-servers'] });
            void queryClient.invalidateQueries({
                queryKey: ['admin-servers-awaiting-review'],
            });
            void queryClient.invalidateQueries({
                queryKey: ['admin-server-detail', serverId],
            });
        },
    });
};

export const useUnverifyServer = (): UseMutationResult<
    { verified: boolean },
    Error,
    string
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (serverId: string): Promise<{ verified: boolean }> =>
            adminServersApi.unverifyServer(serverId),
        onSuccess: (_data, serverId): void => {
            void queryClient.invalidateQueries({ queryKey: ['admin-servers'] });
            void queryClient.invalidateQueries({
                queryKey: ['admin-servers-awaiting-review'],
            });
            void queryClient.invalidateQueries({
                queryKey: ['admin-server-detail', serverId],
            });
        },
    });
};

export const useAdminAwaitingReviewServers = (
    page: number = 0,
    limit: number = ADMIN_CONSTANTS.DEFAULT_PAGE_SIZE,
): UseQueryResult<{ items: AdminServerListItem[]; total: number }> =>
    useQuery({
        queryKey: ['admin-servers-awaiting-review', page, limit],
        queryFn: (): Promise<{ items: AdminServerListItem[]; total: number }> =>
            adminServersApi.getAwaitingReviewServers({
                limit,
                offset: page * limit,
            }),
    });

export const useDeclineVerification = (): UseMutationResult<
    { message: string },
    Error,
    string
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (serverId: string): Promise<{ message: string }> =>
            adminServersApi.declineVerification(serverId),
        onSuccess: (_data, serverId): void => {
            void queryClient.invalidateQueries({
                queryKey: ['admin-servers-awaiting-review'],
            });
            void queryClient.invalidateQueries({ queryKey: ['admin-servers'] });
            void queryClient.invalidateQueries({
                queryKey: ['admin-server-detail', serverId],
            });
        },
    });
};
