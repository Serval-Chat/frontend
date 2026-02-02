import { useCallback } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { SERVERS_QUERY_KEYS } from '@/api/servers/servers.queries';
import { WsEvents } from '@/ws';

import { useWebSocket } from './useWebSocket';

/**
 * @description Hook to listen for server WebSocket events
 */
export const useServerWS = (serverId?: string) => {
    const queryClient = useQueryClient();

    const invalidateServer = useCallback(() => {
        if (serverId) {
            queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.details(serverId),
            });
        }
        queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.list,
        });
    }, [queryClient, serverId]);

    const invalidateChannels = useCallback(() => {
        if (serverId) {
            queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.channels(serverId),
            });
        }
    }, [queryClient, serverId]);

    const invalidateCategories = useCallback(() => {
        if (serverId) {
            queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.categories(serverId),
            });
        }
    }, [queryClient, serverId]);

    // Handle server updates
    useWebSocket(
        WsEvents.SERVER_UPDATED,
        useCallback(
            (payload: { serverId: string }) => {
                if (payload.serverId === serverId || !serverId) {
                    invalidateServer();
                }
            },
            [serverId, invalidateServer],
        ),
    );

    // Handle channel updates
    useWebSocket(
        WsEvents.CHANNEL_CREATED,
        useCallback(
            (payload: { serverId: string }) => {
                if (payload.serverId === serverId) {
                    invalidateChannels();
                }
            },
            [serverId, invalidateChannels],
        ),
    );

    useWebSocket(
        WsEvents.CHANNEL_UPDATED,
        useCallback(
            (payload: { serverId: string }) => {
                if (payload.serverId === serverId) {
                    invalidateChannels();
                }
            },
            [serverId, invalidateChannels],
        ),
    );

    useWebSocket(
        WsEvents.CHANNEL_DELETED,
        useCallback(
            (payload: { serverId: string }) => {
                if (payload.serverId === serverId) {
                    invalidateChannels();
                }
            },
            [serverId, invalidateChannels],
        ),
    );

    useWebSocket(
        WsEvents.CHANNELS_REORDERED,
        useCallback(
            (payload: { serverId: string }) => {
                if (payload.serverId === serverId) {
                    invalidateChannels();
                }
            },
            [serverId, invalidateChannels],
        ),
    );

    // Handle category updates
    useWebSocket(
        WsEvents.CATEGORY_CREATED,
        useCallback(
            (payload: { serverId: string }) => {
                if (payload.serverId === serverId) {
                    invalidateCategories();
                }
            },
            [serverId, invalidateCategories],
        ),
    );

    useWebSocket(
        WsEvents.CATEGORY_UPDATED,
        useCallback(
            (payload: { serverId: string }) => {
                if (payload.serverId === serverId) {
                    invalidateCategories();
                }
            },
            [serverId, invalidateCategories],
        ),
    );

    useWebSocket(
        WsEvents.CATEGORY_DELETED,
        useCallback(
            (payload: { serverId: string }) => {
                if (payload.serverId === serverId) {
                    invalidateCategories();
                    invalidateChannels(); // Orphaned channels might have moved
                }
            },
            [serverId, invalidateCategories, invalidateChannels],
        ),
    );

    useWebSocket(
        WsEvents.CATEGORIES_REORDERED,
        useCallback(
            (payload: { serverId: string }) => {
                if (payload.serverId === serverId) {
                    invalidateCategories();
                }
            },
            [serverId, invalidateCategories],
        ),
    );
};
