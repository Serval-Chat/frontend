import { useCallback } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { SERVERS_QUERY_KEYS } from '@/api/servers/servers.queries';
import type { Channel } from '@/api/servers/servers.types';
import { WsEvents } from '@/ws';

import { useWebSocket } from './useWebSocket';

/**
 * @description Hook to listen for server WebSocket events
 */
export const useServerWS = (serverId?: string): void => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const invalidateServer = useCallback((): void => {
        if (serverId) {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.details(serverId),
            });
        }
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.list,
        });
    }, [queryClient, serverId]);

    const invalidateChannels = useCallback((): void => {
        if (serverId) {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.channels(serverId),
            });
        }
    }, [queryClient, serverId]);

    const invalidateOnboarding = useCallback((): void => {
        if (serverId) {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.onboarding(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.onboardingSettings(serverId),
            });
        }
    }, [queryClient, serverId]);

    const invalidateCategories = useCallback((): void => {
        if (serverId) {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.categories(serverId),
            });
        }
    }, [queryClient, serverId]);

    // Handle server updates
    useWebSocket(
        WsEvents.SERVER_UPDATED,
        useCallback(
            (payload: { serverId: string }): void => {
                if (payload.serverId === serverId) {
                    invalidateServer();
                    invalidateOnboarding();
                }
            },
            [serverId, invalidateServer, invalidateOnboarding],
        ),
    );

    // Handle server administrative updates
    useWebSocket(
        WsEvents.SERVER_ICON_UPDATED,
        useCallback(
            (payload: { serverId: string }): void => {
                if (payload.serverId === serverId) {
                    invalidateServer();
                }
            },
            [serverId, invalidateServer],
        ),
    );

    useWebSocket(
        WsEvents.SERVER_BANNER_UPDATED,
        useCallback(
            (payload: { serverId: string }): void => {
                if (payload.serverId === serverId) {
                    invalidateServer();
                }
            },
            [serverId, invalidateServer],
        ),
    );

    useWebSocket(
        WsEvents.OWNERSHIP_TRANSFERRED,
        useCallback(
            (payload: { serverId: string }): void => {
                if (payload.serverId === serverId) {
                    invalidateServer();
                    // Also invalidate me to update ownership status if we are involved
                    void queryClient.invalidateQueries({ queryKey: ['me'] });
                }
            },
            [serverId, invalidateServer, queryClient],
        ),
    );

    useWebSocket(
        WsEvents.SERVER_DELETED,
        useCallback(
            (payload: { serverId: string }): void => {
                if (payload.serverId === serverId) {
                    void navigate('/chat/@me');
                }
                invalidateServer();
            },
            [serverId, invalidateServer, navigate],
        ),
    );

    // Handle channel updates
    useWebSocket(
        WsEvents.CHANNEL_CREATED,
        useCallback(
            (payload: { serverId: string }): void => {
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
            (payload: { serverId: string }): void => {
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
            (payload: { serverId: string }): void => {
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
            (payload: { serverId: string }): void => {
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
            (payload: { serverId: string }): void => {
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
            (payload: { serverId: string }): void => {
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
            (payload: { serverId: string }): void => {
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
            (payload: { serverId: string }): void => {
                if (payload.serverId === serverId) {
                    invalidateCategories();
                }
            },
            [serverId, invalidateCategories],
        ),
    );

    // Handle member updates
    useWebSocket(
        WsEvents.MEMBER_UPDATED,
        useCallback(
            (payload: { serverId: string }): void => {
                if (payload.serverId === serverId) {
                    void queryClient.invalidateQueries({
                        queryKey: SERVERS_QUERY_KEYS.members(payload.serverId),
                    });
                    invalidateOnboarding();
                }
            },
            [serverId, queryClient, invalidateOnboarding],
        ),
    );

    useWebSocket(
        WsEvents.MEMBER_REMOVED,
        useCallback(
            (payload: { serverId: string; userId: string }): void => {
                if (payload.serverId === serverId) {
                    void queryClient.invalidateQueries({
                        queryKey: SERVERS_QUERY_KEYS.members(payload.serverId),
                    });
                    // Also invalidate me if I was the one removed
                    void queryClient.invalidateQueries({ queryKey: ['me'] });
                }
            },
            [serverId, queryClient],
        ),
    );

    useWebSocket(
        WsEvents.MEMBER_ADDED,
        useCallback(
            (payload: { serverId: string; userId: string }): void => {
                if (payload.serverId === serverId) {
                    void queryClient.invalidateQueries({
                        queryKey: SERVERS_QUERY_KEYS.members(payload.serverId),
                    });
                }
            },
            [serverId, queryClient],
        ),
    );

    // Handle unread updates
    useWebSocket(
        WsEvents.CHANNEL_UNREAD_UPDATED,
        useCallback(
            (payload: { serverId: string; channelId: string }): void => {
                if (payload.serverId === serverId) {
                    queryClient.setQueryData<Channel[]>(
                        SERVERS_QUERY_KEYS.channels(serverId),
                        (old): Channel[] | undefined =>
                            old?.map(
                                (c): Channel =>
                                    c.id === payload.channelId
                                        ? {
                                              ...c,
                                              lastReadAt:
                                                  new Date().toISOString(),
                                          }
                                        : c,
                            ) ?? old,
                    );
                }
            },
            [serverId, queryClient],
        ),
    );
};
