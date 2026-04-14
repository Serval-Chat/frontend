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
import type { AdminServerDetails, AdminServerListItem } from '@/types/admin';

export const useAdminServers = (
    search: string = '',
    page: number = 0,
    limit: number = ADMIN_CONSTANTS.DEFAULT_PAGE_SIZE,
): UseQueryResult<AdminServerListItem[]> =>
    useQuery({
        queryKey: ['admin-servers', search, page, limit],
        queryFn: () =>
            adminServersApi.listServers({
                search,
                limit,
                offset: page * limit,
            }),
    });

export const useDeleteServer = (): UseMutationResult<
    { message: string },
    Error,
    string
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (serverId: string) =>
            adminServersApi.deleteServer(serverId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['admin-servers'] });
        },
    });
};

export const useRestoreServer = (): UseMutationResult<
    { message: string },
    Error,
    string
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (serverId: string) =>
            adminServersApi.restoreServer(serverId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['admin-servers'] });
        },
    });
};

export const useAdminServerDetail = (
    serverId: string | null,
): UseQueryResult<AdminServerDetails> =>
    useQuery({
        queryKey: ['admin-server-detail', serverId],
        queryFn: () => adminServersApi.getServerDetails(serverId!),
        enabled: !!serverId,
    });

export const useAdminServerInvites = (
    serverId: string | null,
): UseQueryResult<ServerInvite[]> =>
    useQuery({
        queryKey: ['admin-server-invites', serverId],
        queryFn: () =>
            adminServersApi.getServerInvites(serverId!) as Promise<
                ServerInvite[]
            >,
        enabled: !!serverId,
    });

export const useDeleteAdminServerInvite = (
    serverId: string,
): UseMutationResult<{ message: string }, Error, string> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (inviteId: string) =>
            adminServersApi.deleteServerInvite(serverId, inviteId),
        onSuccess: () => {
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
        mutationFn: (serverId: string) =>
            adminServersApi.verifyServer(serverId),
        onSuccess: (_data, serverId) => {
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
        mutationFn: (serverId: string) =>
            adminServersApi.unverifyServer(serverId),
        onSuccess: (_data, serverId) => {
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
        queryFn: () =>
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
        mutationFn: (serverId: string) =>
            adminServersApi.declineVerification(serverId),
        onSuccess: (_data, serverId) => {
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
