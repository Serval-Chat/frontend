import { type Dispatch } from '@reduxjs/toolkit';
import { type QueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';

import { CHAT_QUERY_KEYS } from '@/api/chat/chat.queries';
import type { ChatMessage } from '@/api/chat/chat.types';
import {
    FRIENDS_QUERY_KEY,
    FRIEND_REQUESTS_QUERY_KEY,
} from '@/api/friends/friends.queries';
import { serversApi } from '@/api/servers/servers.api';
import { SERVERS_QUERY_KEYS } from '@/api/servers/servers.queries';
import type { User } from '@/api/users/users.types';
import {
    setOnlineUsers,
    setUserOffline,
    setUserOnline,
    updateUserStatusByUsername,
} from '@/store/slices/presenceSlice';
import {
    setDmUnread,
    setServerUnread,
    setUnreadServers,
} from '@/store/slices/unreadSlice';

import { wsClient } from './client';
import {
    type IMemberAddedEvent,
    type IMemberUpdatedEvent,
    type IMessageDm,
    type IMessageServer,
    type IPresenceSyncEvent,
    type IStatusUpdatedEvent,
    type IUserOfflineEvent,
    type IUserOnlineEvent,
    type IWsAuthenticatedEvent,
    type IWsErrorEvent,
    WsEvents,
} from './events';

/**
 * @description Global WS handlers
 */
export const setupGlobalWsHandlers = (
    queryClient: QueryClient,
    dispatch: Dispatch,
): void => {
    let currentUser: { id: string; username: string } | null = null;

    wsClient.on<IWsErrorEvent>(WsEvents.ERROR, (payload) => {
        console.error('[WS] Global Error:', payload.message);
    });

    wsClient.on<IWsAuthenticatedEvent>(WsEvents.AUTHENTICATED, (payload) => {
        if (payload.user) {
            currentUser = payload.user;
            dispatch(
                setUserOnline({
                    userId: payload.user.id,
                    username: payload.user.username,
                    status: undefined,
                }),
            );
            // Fetch initial unread status for servers
            serversApi
                .getUnreadStatus()
                .then((unreadMap) => {
                    dispatch(setUnreadServers(unreadMap));
                })
                .catch(() => {});
        }
    });

    // Server unread (from WebSocket)
    wsClient.on<{ serverId: string; hasUnread: boolean }>(
        WsEvents.SERVER_UNREAD_UPDATED,
        (payload) => {
            dispatch(
                setServerUnread({
                    serverId: payload.serverId,
                    unread: payload.hasUnread,
                }),
            );
        },
    );

    // DM unread (from WebSocket) – sync Redux with backend
    wsClient.on<{ peerId: string; count: number }>(
        WsEvents.DM_UNREAD_UPDATED,
        (payload) => {
            dispatch(
                setDmUnread({
                    userId: payload.peerId,
                    unread: payload.count > 0,
                }),
            );
        },
    );

    // Friendship events
    wsClient.on(WsEvents.FRIEND_ADDED, () => {
        void queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
        void queryClient.invalidateQueries({
            queryKey: FRIEND_REQUESTS_QUERY_KEY,
        });
    });

    wsClient.on(WsEvents.FRIEND_REMOVED, () => {
        void queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
        void queryClient.invalidateQueries({
            queryKey: FRIEND_REQUESTS_QUERY_KEY,
        });
    });

    wsClient.on(WsEvents.INCOMING_REQUEST_ADDED, () => {
        void queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
        void queryClient.invalidateQueries({
            queryKey: FRIEND_REQUESTS_QUERY_KEY,
        });
    });

    wsClient.on(WsEvents.INCOMING_REQUEST_REMOVED, () => {
        void queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
        void queryClient.invalidateQueries({
            queryKey: FRIEND_REQUESTS_QUERY_KEY,
        });
    });

    // Presence events
    wsClient.on<IPresenceSyncEvent>(WsEvents.PRESENCE_SYNC, (payload) => {
        const onlineUsers = [...payload.online];
        const me = queryClient.getQueryData<{ id: string }>(['me']);

        if (me && !onlineUsers.some((u) => u.userId === me.id)) {
            onlineUsers.push({
                userId: me.id,
                username: (me as unknown as User).username || '',
                status: undefined,
            });
        }

        dispatch(setOnlineUsers(onlineUsers));
    });

    wsClient.on<IUserOnlineEvent>(WsEvents.USER_ONLINE, (payload) => {
        dispatch(setUserOnline(payload));
    });

    wsClient.on<IUserOfflineEvent>(WsEvents.USER_OFFLINE, (payload) => {
        dispatch(setUserOffline(payload));
    });

    wsClient.on<IStatusUpdatedEvent>(WsEvents.STATUS_UPDATED, (payload) => {
        const statusText = payload.status?.text || undefined;

        // Update presence state by username
        dispatch(
            updateUserStatusByUsername({
                username: payload.username,
                customStatus: statusText,
            }),
        );

        if (currentUser && payload.username === currentUser.username) {
            void queryClient.invalidateQueries({ queryKey: ['me'] });
        }
    });

    wsClient.on<IMemberUpdatedEvent>(WsEvents.MEMBER_UPDATED, (payload) => {
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.members(payload.serverId),
        });
        if (currentUser && payload.userId === currentUser.id) {
            // Invalidate 'me' if my own roles changed
            void queryClient.invalidateQueries({ queryKey: ['me'] });
        }
    });

    wsClient.on<IMemberAddedEvent>(WsEvents.MEMBER_ADDED, (payload) => {
        if (currentUser && payload.userId === currentUser.id) {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.list,
            });
        }
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.members(payload.serverId),
        });
    });

    // Role events
    wsClient.on<{ serverId: string }>(WsEvents.ROLE_CREATED, (payload) => {
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.roles(payload.serverId),
        });
    });

    wsClient.on<{ serverId: string }>(WsEvents.ROLE_UPDATED, (payload) => {
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.roles(payload.serverId),
        });
    });

    wsClient.on<{ serverId: string }>(WsEvents.ROLE_DELETED, (payload) => {
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.roles(payload.serverId),
        });
    });

    wsClient.on<{ serverId: string }>(WsEvents.ROLES_REORDERED, (payload) => {
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.roles(payload.serverId),
        });
    });

    // Message editing events
    wsClient.on<{
        messageId: string;
        serverId: string;
        channelId: string;
        text: string;
        editedAt: string;
        isEdited: boolean;
    }>(WsEvents.MESSAGE_SERVER_EDITED, (payload) => {
        // Update the message in the cache
        const queryKey = CHAT_QUERY_KEYS.channelMessages(
            payload.serverId,
            payload.channelId,
        );
        const currentData = queryClient.getQueryData(queryKey) as
            | InfiniteData<ChatMessage[]>
            | undefined;

        if (currentData?.pages) {
            queryClient.setQueryData(queryKey, {
                ...currentData,
                pages: currentData.pages.map((page: ChatMessage[]) =>
                    page.map((msg) =>
                        msg._id === payload.messageId
                            ? {
                                  ...msg,
                                  text: payload.text,
                                  isEdited: payload.isEdited,
                                  editedAt: payload.editedAt,
                              }
                            : msg,
                    ),
                ),
            });
        }
    });

    wsClient.on<{
        messageId: string;
        senderId: string;
        receiverId: string;
        text: string;
        editedAt: string;
        isEdited: boolean;
    }>(WsEvents.MESSAGE_DM_EDITED, (payload) => {
        // Update DM message in cache for both users
        const queryKey1 = CHAT_QUERY_KEYS.userMessages(payload.senderId);
        const queryKey2 = CHAT_QUERY_KEYS.userMessages(payload.receiverId);

        [queryKey1, queryKey2].forEach((queryKey) => {
            const currentData = queryClient.getQueryData(queryKey) as
                | InfiniteData<ChatMessage[]>
                | undefined;
            if (currentData?.pages) {
                queryClient.setQueryData(queryKey, {
                    ...currentData,
                    pages: currentData.pages.map((page: ChatMessage[]) =>
                        page.map((msg) =>
                            msg._id === payload.messageId
                                ? {
                                      ...msg,
                                      text: payload.text,
                                      isEdited: payload.isEdited,
                                      editedAt: payload.editedAt,
                                  }
                                : msg,
                        ),
                    ),
                });
            }
        });
    });
};

/**
 * @description WS handlers
 */
export const wsHandlers = {
    onMessageDm: (handler: (message: IMessageDm) => void) =>
        wsClient.on(WsEvents.MESSAGE_DM, handler),
    onMessageServer: (handler: (message: IMessageServer) => void) =>
        wsClient.on(WsEvents.MESSAGE_SERVER, handler),
};
