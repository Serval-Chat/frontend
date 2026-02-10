import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { invitesApi } from './invites.api';
import type {
    CreateInviteData,
    InviteDetails,
    ServerInvite,
} from './invites.types';

export const inviteKeys = {
    all: ['invites'] as const,
    details: (code: string) => [...inviteKeys.all, 'details', code] as const,
    serverInvites: (serverId: string) =>
        [...inviteKeys.all, 'server', serverId] as const,
};

export const useInviteDetails = (
    code: string,
): UseQueryResult<InviteDetails, Error> =>
    useQuery({
        queryKey: inviteKeys.details(code),
        queryFn: () => invitesApi.getInviteDetails(code),
        enabled: !!code,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

export const useServerInvites = (
    serverId: string,
): UseQueryResult<ServerInvite[], Error> =>
    useQuery({
        queryKey: inviteKeys.serverInvites(serverId),
        queryFn: () => invitesApi.getServerInvites(serverId),
        enabled: !!serverId,
    });

export const useCreateInvite = (
    serverId: string,
): UseMutationResult<ServerInvite, Error, CreateInviteData> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateInviteData) =>
            invitesApi.createInvite(serverId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: inviteKeys.serverInvites(serverId),
            });
        },
    });
};

export const useDeleteInvite = (
    serverId: string,
): UseMutationResult<{ message: string }, Error, string> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (inviteId: string) =>
            invitesApi.deleteInvite(serverId, inviteId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: inviteKeys.serverInvites(serverId),
            });
        },
    });
};

export const useJoinServer = (): UseMutationResult<
    { serverId: string },
    Error,
    string
> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: invitesApi.joinServer,
        onSuccess: () => {
            // Invalidate servers list to show the new server
            void queryClient.invalidateQueries({ queryKey: ['servers'] });
        },
    });
};
