import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { useDispatch } from 'react-redux';

import { SERVERS_QUERY_KEYS } from '@/api/servers/servers.queries';
import {
    decrementServerPing,
    setServerPingCount,
    setUnreadServers,
} from '@/store/slices/unreadSlice';
import { hasAuthToken } from '@/utils/authToken';

import { pingsApi } from './pings.api';
import type {
    ClearChannelPingsResponse,
    DeletePingResponse,
    GetPingsResponse,
    PingNotification,
} from './pings.types';

export const PINGS_KEYS = {
    all: ['pings'] as const,
};

export const usePings = (): UseQueryResult<GetPingsResponse, Error> =>
    useQuery({
        queryKey: PINGS_KEYS.all,
        queryFn: pingsApi.getPings,
        enabled: hasAuthToken(),
    });

export function useDeletePing(): UseMutationResult<
    DeletePingResponse,
    Error,
    string
> {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();

    return useMutation({
        mutationFn: pingsApi.deletePing,
        onSuccess: (_, deletedId) => {
            const oldData = queryClient.getQueryData<{
                pings: PingNotification[];
            }>(PINGS_KEYS.all);
            const pingToDelete = oldData?.pings.find((p) => p.id === deletedId);

            queryClient.setQueryData(
                PINGS_KEYS.all,
                (oldData: { pings: PingNotification[] } | undefined) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        pings: oldData.pings.filter((p) => p.id !== deletedId),
                    };
                },
            );

            // Update Redux state
            if (pingToDelete?.serverId) {
                dispatch(
                    decrementServerPing({ serverId: pingToDelete.serverId }),
                );
            }

            // Also invalidate unread status to ensure server badges update
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.unread(),
            });
        },
    });
}

export function useClearChannelPings(): UseMutationResult<
    ClearChannelPingsResponse,
    Error,
    string
> {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();

    return useMutation({
        mutationFn: pingsApi.clearChannelPings,
        onSuccess: (_, channelId) => {
            const oldData = queryClient.getQueryData<{
                pings: PingNotification[];
            }>(PINGS_KEYS.all);
            const channelPings =
                oldData?.pings.filter((p) => p.channelId === channelId) || [];
            const serverId = channelPings[0]?.serverId;

            queryClient.setQueryData(
                PINGS_KEYS.all,
                (oldData: { pings: PingNotification[] } | undefined) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        pings: oldData.pings.filter(
                            (p) => p.channelId !== channelId,
                        ),
                    };
                },
            );

            // Update Redux state
            if (serverId) {
                const currentCount =
                    queryClient.getQueryData<{
                        [serverId: string]: { pingCount: number };
                    }>(SERVERS_QUERY_KEYS.unread())?.[serverId]?.pingCount || 0;

                dispatch(
                    setServerPingCount({
                        serverId,
                        count: Math.max(0, currentCount - channelPings.length),
                    }),
                );
            }

            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.unread(),
            });
        },
    });
}

export function useClearAllPings(): UseMutationResult<
    DeletePingResponse,
    Error,
    void
> {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();

    return useMutation({
        mutationFn: pingsApi.clearAllPings,
        onSuccess: () => {
            queryClient.setQueryData(PINGS_KEYS.all, { pings: [] });
            dispatch(setUnreadServers({})); // Clear all unread/pings in Redux too
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.unread(),
            });
        },
    });
}
