import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { invitesApi } from './invites.api';
import type {
    CreateInviteData,
    InviteDetails,
    ServerInvite,
} from './invites.types';

export const inviteKeys = {
    all: ['invites'] as const,
    details: (code: string): readonly ['invites', 'details', string] =>
        [...inviteKeys.all, 'details', code] as const,
    serverInvites: (serverId: string): readonly ['invites', 'server', string] =>
        [...inviteKeys.all, 'server', serverId] as const,
};

export const useInviteDetails = (
    code: string,
    options: { enabled?: boolean } = {},
): UseQueryResult<InviteDetails, Error> =>
    useQuery({
        queryKey: inviteKeys.details(code),
        queryFn: (): Promise<InviteDetails> =>
            invitesApi.getInviteDetails(code),
        enabled: (options.enabled ?? true) && !!code,
    });

export const useServerInvites = (
    serverId: string,
): UseQueryResult<ServerInvite[], Error> =>
    useQuery({
        queryKey: inviteKeys.serverInvites(serverId),
        queryFn: (): Promise<ServerInvite[]> =>
            invitesApi.getServerInvites(serverId),
        enabled: !!serverId,
    });

export const useCreateInvite = (
    serverId: string,
): UseMutationResult<ServerInvite, Error, CreateInviteData> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateInviteData): Promise<ServerInvite> =>
            invitesApi.createInvite(serverId, data),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: inviteKeys.serverInvites(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: ['servers', 'discovery-status', serverId],
            });
            void queryClient.invalidateQueries({
                queryKey: ['servers', 'discovery'],
            });
        },
    });
};

export const useDeleteInvite = (
    serverId: string,
): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (inviteId: string): Promise<void> =>
            invitesApi.deleteInvite(serverId, inviteId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: inviteKeys.serverInvites(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: ['servers', 'discovery-status', serverId],
            });
            void queryClient.invalidateQueries({
                queryKey: ['servers', 'discovery'],
            });
        },
    });
};

export const useJoinServer = (): UseMutationResult<
    { serverId: string },
    AxiosError,
    string
> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: invitesApi.joinServer,
        onSuccess: (): void => {
            // Invalidate servers list to show the new server
            void queryClient.invalidateQueries({ queryKey: ['servers'] });
        },
    });
};
