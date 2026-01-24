import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { invitesApi } from './invites.api';
import type { InviteDetails } from './invites.types';

export const inviteKeys = {
    all: ['invites'] as const,
    details: (code: string) => [...inviteKeys.all, 'details', code] as const,
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
