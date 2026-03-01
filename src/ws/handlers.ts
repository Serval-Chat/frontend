import { type Dispatch } from '@reduxjs/toolkit';
import { type QueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';

import { CHAT_QUERY_KEYS } from '@/api/chat/chat.queries';
import type { ChatMessage } from '@/api/chat/chat.types';
import {
    FRIENDS_QUERY_KEY,
    FRIEND_REQUESTS_QUERY_KEY,
} from '@/api/friends/friends.queries';
import type { Friend } from '@/api/friends/friends.types';
import { serversApi } from '@/api/servers/servers.api';
import { SERVERS_QUERY_KEYS } from '@/api/servers/servers.queries';
import type { ServerMember } from '@/api/servers/servers.types';
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
    type ICategoriesReorderedEvent,
    type ICategoryDeletedEvent,
    type ICategoryEvent,
    type IChannelDeletedEvent,
    type IChannelEvent,
    type IChannelsReorderedEvent,
    type IDisplayNameUpdatedEvent,
    type IEmojiUpdatedEvent,
    type IMemberAddedEvent,
    type IMemberRemovedEvent,
    type IMemberUpdatedEvent,
    type IMessageDm,
    type IMessageServer,
    type IOwnershipTransferredEvent,
    type IPermissionsUpdatedEvent,
    type IPresenceSyncEvent,
    type IRoleDeletedEvent,
    type IRoleEvent,
    type IRolesReorderedEvent,
    type IServerBannerUpdatedEvent,
    type IServerIconUpdatedEvent,
    type IServerUpdatedEvent,
    type IStatusUpdatedEvent,
    type IUserBannerUpdatedEvent,
    type IUserOfflineEvent,
    type IUserOnlineEvent,
    type IUserUpdatedEvent,
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
        // Update presence state by username
        dispatch(
            updateUserStatusByUsername({
                username: payload.username,
                customStatus: payload.status,
            }),
        );

        if (currentUser && payload.username === currentUser.username) {
            void queryClient.invalidateQueries({ queryKey: ['me'] });
        }
    });

    wsClient.on<IUserUpdatedEvent>(WsEvents.USER_UPDATED, (payload) => {
        if (payload.senderId === currentUser?.id) {
            void queryClient.invalidateQueries({ queryKey: ['me'] });
            return;
        }
        void queryClient.invalidateQueries({
            queryKey: ['user', payload.userId],
        });
        if (currentUser && payload.userId === currentUser.id) {
            void queryClient.invalidateQueries({ queryKey: ['me'] });
        }

        queryClient.setQueriesData<ServerMember[]>(
            { queryKey: ['servers', 'members'] },
            (old) => {
                if (!old) return old;
                return old.map((member) =>
                    member.userId === payload.userId
                        ? {
                              ...member,
                              user: { ...member.user, ...payload } as User,
                          }
                        : member,
                );
            },
        );

        queryClient.setQueriesData<Friend[]>(
            { queryKey: FRIENDS_QUERY_KEY },
            (old) => {
                if (!old) return old;
                return old.map((friend) =>
                    friend._id === payload.userId
                        ? { ...friend, ...payload }
                        : friend,
                );
            },
        );
    });

    wsClient.on<IUserBannerUpdatedEvent>(
        WsEvents.USER_BANNER_UPDATED,
        (payload) => {
            void queryClient.invalidateQueries({ queryKey: ['user'] });
            if (currentUser && payload.username === currentUser.username) {
                void queryClient.invalidateQueries({ queryKey: ['me'] });
            }

            queryClient.setQueriesData<ServerMember[]>(
                { queryKey: ['servers', 'members'] },
                (old) => {
                    if (!old) return old;
                    return old.map((member) =>
                        member.user.username === payload.username
                            ? {
                                  ...member,
                                  user: {
                                      ...member.user,
                                      banner: payload.banner,
                                  },
                              }
                            : member,
                    );
                },
            );
        },
    );

    wsClient.on<IDisplayNameUpdatedEvent>(
        WsEvents.DISPLAY_NAME_UPDATED,
        (payload) => {
            void queryClient.invalidateQueries({ queryKey: ['user'] });
            if (currentUser && payload.username === currentUser.username) {
                void queryClient.invalidateQueries({ queryKey: ['me'] });
            }

            queryClient.setQueriesData<ServerMember[]>(
                { queryKey: ['servers', 'members'] },
                (old) => {
                    if (!old) return old;
                    return old.map((member) =>
                        member.user.username === payload.username
                            ? {
                                  ...member,
                                  user: {
                                      ...member.user,
                                      displayName: payload.displayName,
                                  },
                              }
                            : member,
                    );
                },
            );

            queryClient.setQueriesData<Friend[]>(
                { queryKey: FRIENDS_QUERY_KEY },
                (old) => {
                    if (!old) return old;
                    return old.map((friend) =>
                        friend.username === payload.username
                            ? { ...friend, displayName: payload.displayName }
                            : friend,
                    );
                },
            );
        },
    );

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
    wsClient.on<IRoleEvent>(WsEvents.ROLE_CREATED, (payload) => {
        if (payload.senderId === currentUser?.id) return;
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.roles(payload.serverId),
        });
    });

    wsClient.on<IRoleEvent>(WsEvents.ROLE_UPDATED, (payload) => {
        if (payload.senderId === currentUser?.id) return;
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.roles(payload.serverId),
        });
    });

    wsClient.on<IRoleDeletedEvent>(WsEvents.ROLE_DELETED, (payload) => {
        if (payload.senderId === currentUser?.id) return;
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.roles(payload.serverId),
        });
    });

    wsClient.on<IRolesReorderedEvent>(WsEvents.ROLES_REORDERED, (payload) => {
        if (payload.senderId === currentUser?.id) return;
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.roles(payload.serverId),
        });
    });

    // Channel events
    wsClient.on<IChannelEvent>(WsEvents.CHANNEL_CREATED, (payload) => {
        if (payload.senderId === currentUser?.id) return;
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.channels(payload.serverId),
        });
    });

    wsClient.on<IChannelEvent>(WsEvents.CHANNEL_UPDATED, (payload) => {
        if (payload.senderId === currentUser?.id) return;
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.channels(payload.serverId),
        });
    });

    wsClient.on<IChannelDeletedEvent>(WsEvents.CHANNEL_DELETED, (payload) => {
        if (payload.senderId === currentUser?.id) return;
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.channels(payload.serverId),
        });
    });

    wsClient.on<IChannelsReorderedEvent>(
        WsEvents.CHANNELS_REORDERED,
        (payload) => {
            if (payload.senderId === currentUser?.id) return;
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.channels(payload.serverId),
            });
        },
    );

    // Category events
    wsClient.on<ICategoryEvent>(WsEvents.CATEGORY_CREATED, (payload) => {
        if (payload.senderId === currentUser?.id) return;
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.categories(payload.serverId),
        });
    });

    wsClient.on<ICategoryEvent>(WsEvents.CATEGORY_UPDATED, (payload) => {
        if (payload.senderId === currentUser?.id) return;
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.categories(payload.serverId),
        });
    });

    wsClient.on<ICategoryDeletedEvent>(WsEvents.CATEGORY_DELETED, (payload) => {
        if (payload.senderId === currentUser?.id) return;
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.categories(payload.serverId),
        });
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.channels(payload.serverId),
        });
    });

    wsClient.on<ICategoriesReorderedEvent>(
        WsEvents.CATEGORIES_REORDERED,
        (payload) => {
            if (payload.senderId === currentUser?.id) return;
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.categories(payload.serverId),
            });
        },
    );

    // Permission events
    wsClient.on<IPermissionsUpdatedEvent>(
        WsEvents.CHANNEL_PERMISSIONS_UPDATED,
        (payload) => {
            if (payload.senderId === currentUser?.id) return;
            void queryClient.invalidateQueries({
                queryKey: [
                    'servers',
                    'channel_permissions',
                    payload.serverId,
                    payload.channelId,
                ],
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.channels(payload.serverId),
            });
        },
    );

    wsClient.on<IPermissionsUpdatedEvent>(
        WsEvents.CATEGORY_PERMISSIONS_UPDATED,
        (payload) => {
            if (payload.senderId === currentUser?.id) return;
            void queryClient.invalidateQueries({
                queryKey: [
                    'servers',
                    'category_permissions',
                    payload.serverId,
                    payload.categoryId,
                ],
            });
        },
    );

    // Server events
    wsClient.on<IServerUpdatedEvent>(WsEvents.SERVER_UPDATED, (payload) => {
        if (payload.senderId === currentUser?.id) return;
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.details(payload.serverId),
        });
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.list,
        });
    });

    wsClient.on<{ serverId: string; senderId?: string }>(
        WsEvents.SERVER_DELETED,
        (payload) => {
            if (payload.senderId === currentUser?.id) return;
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.list,
            });
        },
    );

    wsClient.on<IServerIconUpdatedEvent>(
        WsEvents.SERVER_ICON_UPDATED,
        (payload) => {
            if (payload.senderId === currentUser?.id) return;
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.details(payload.serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.list,
            });
        },
    );

    wsClient.on<IServerBannerUpdatedEvent>(
        WsEvents.SERVER_BANNER_UPDATED,
        (payload) => {
            if (payload.senderId === currentUser?.id) return;
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.details(payload.serverId),
            });
        },
    );

    wsClient.on<IOwnershipTransferredEvent>(
        WsEvents.OWNERSHIP_TRANSFERRED,
        (payload) => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.details(payload.serverId),
            });
        },
    );

    wsClient.on<IMemberRemovedEvent>(WsEvents.MEMBER_REMOVED, (payload) => {
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.members(payload.serverId),
        });
        if (currentUser && payload.userId === currentUser.id) {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.list,
            });
        }
    });

    // Emoji events
    wsClient.on<IEmojiUpdatedEvent>(WsEvents.EMOJI_UPDATED, (payload) => {
        if (payload.senderId === currentUser?.id) return;
        void queryClient.invalidateQueries({
            queryKey: SERVERS_QUERY_KEYS.emojis(payload.serverId),
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

    wsClient.on(WsEvents.DISCONNECTED, () => {
        void queryClient.invalidateQueries();
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
