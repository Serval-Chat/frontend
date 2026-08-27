import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';

import { deleteVanityLink, getVanityLink, setVanityLink } from './vanity.api';
import type { SetVanityLinkRequest, VanityLink } from './vanity.types';

const vanityLinkKeys = {
    all: ['vanity-link'] as const,
    server: (serverId: string): readonly ['vanity-link', string] =>
        [...vanityLinkKeys.all, serverId] as const,
};

const invalidateVanityAndDiscovery = (
    queryClient: QueryClient,
    serverId: string,
): void => {
    void queryClient.invalidateQueries({
        queryKey: vanityLinkKeys.server(serverId),
    });
    void queryClient.invalidateQueries({
        queryKey: ['servers', 'discovery-status', serverId],
    });
    void queryClient.invalidateQueries({
        queryKey: ['servers', 'discovery'],
    });
};

export const useVanityLink = (serverId: string): UseQueryResult<VanityLink> =>
    useQuery({
        queryKey: vanityLinkKeys.server(serverId),
        queryFn: (): Promise<VanityLink> => getVanityLink(serverId),
        enabled: !!serverId,
    });

export const useSetVanityLink = (
    serverId: string,
): UseMutationResult<VanityLink, Error, SetVanityLinkRequest> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: SetVanityLinkRequest): Promise<VanityLink> =>
            setVanityLink(serverId, data),
        onSuccess: (): void => {
            invalidateVanityAndDiscovery(queryClient, serverId);
        },
    });
};

export const useDeleteVanityLink = (
    serverId: string,
): UseMutationResult<void, Error, void> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (): Promise<void> => deleteVanityLink(serverId),
        onSuccess: (): void => {
            invalidateVanityAndDiscovery(queryClient, serverId);
        },
    });
};
