import { type Dispatch } from '@reduxjs/toolkit';
import { type QueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';

import { chatApi } from '@/api/chat/chat.api';
import { CHAT_QUERY_KEYS } from '@/api/chat/chat.queries';
import type { ChatMessage } from '@/api/chat/chat.types';
import {
    FRIENDS_QUERY_KEY,
    FRIEND_PROFILES_QUERY_KEY,
    FRIEND_REQUESTS_QUERY_KEY,
} from '@/api/friends/friends.queries';
import type { Friend } from '@/api/friends/friends.types';
import type {
    PingExportMessage,
    PingMentionMessage,
    PingNotification,
} from '@/api/pings/pings.types';
import { serversApi } from '@/api/servers/servers.api';
import { SERVERS_QUERY_KEYS } from '@/api/servers/servers.queries';
import type { Channel, ServerMember } from '@/api/servers/servers.types';
import type { User, UserSettings } from '@/api/users/users.types';
import {
    setBackendInstanceId,
    setOnlineUsers,
    setUserOffline,
    setUserOnline,
    updateUserStatusByUsername,
} from '@/store/slices/presenceSlice';
import {
    incrementServerPing,
    setDmUnread,
    setServerUnread,
    setUnreadDms,
    setUnreadServers,
} from '@/store/slices/unreadSlice';
import {
    addVoiceParticipant,
    clearUserFromAllVoiceChannels,
    removeVoiceParticipant,
    setVoiceParticipants,
    setVoiceUserState,
} from '@/store/slices/voiceSlice';
import { cacheSound, pruneSoundCache } from '@/utils/soundCache';

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
    type IMentionEvent,
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
    type IServerJoinedEvent,
    type IServerUpdatedEvent,
    type IStatusUpdatedEvent,
    type IUserBannerUpdatedEvent,
    type IUserJoinedVoiceEvent,
    type IUserLeftVoiceEvent,
    type IUserOfflineEvent,
    type IUserOnlineEvent,
    type IUserUpdatedEvent,
    type IVoiceJoinedEvent,
    type IVoiceStateUpdatedEvent,
    type IWsAuthenticatedEvent,
    type IWsErrorEvent,
    WsEvents,
} from './events';

let soundQueue: number[] = [];

interface IChannelUnreadUpdatedEvent {
    serverId: string;
    channelId: string;
    lastMessageAt?: string | null;
    lastReadAt?: string;
    senderId?: string;
}

const addMessageToInfiniteCache = (
    queryClient: QueryClient,
    queryKey: readonly unknown[],
    newMessage: ChatMessage,
): void => {
    queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
        queryKey,
        (oldData) => {
            if (!oldData) return oldData;

            const firstPage = oldData.pages[0] || [];
            if (firstPage.some((msg) => msg._id === newMessage._id)) {
                return oldData;
            }

            return {
                ...oldData,
                pages: [[...firstPage, newMessage], ...oldData.pages.slice(1)],
            };
        },
    );
};

const convertDmToChatMessage = (message: IMessageDm): ChatMessage => ({
    _id: message.messageId,
    text: message.text,
    createdAt: message.createdAt,
    senderId: message.senderId,
    receiverId: message.receiverId,
    replyToId: message.replyToId,
    repliedTo: message.repliedTo,
    isEdited: message.isEdited,
    stickerId: message.stickerId,
    poll: message.poll,
    embeds: message.embeds,
    attachments: message.attachments,
});

const convertServerMessageToChatMessage = (
    message: IMessageServer,
): ChatMessage => ({
    _id: message.messageId,
    text: message.text,
    createdAt: message.createdAt,
    senderId: message.senderId,
    serverId: message.serverId,
    channelId: message.channelId,
    replyToId: message.replyToId,
    isEdited: message.isEdited,
    isWebhook: message.isWebhook,
    webhookUsername: message.webhookUsername,
    webhookAvatarUrl: message.webhookAvatarUrl,
    embeds: message.embeds,
    attachments: message.attachments,
    interaction: message.interaction
        ? {
              command: message.interaction.command,
              options: message.interaction.options as NonNullable<
                  ChatMessage['interaction']
              >['options'],
              user: message.interaction.user || {
                  id: message.senderId,
                  username: message.senderUsername,
              },
          }
        : undefined,
    stickerId: message.stickerId,
    poll: message.poll,
});

const playNotificationSound = (queryClient: QueryClient): void => {
    // Run asynchronously to allow for better stacking and prevent blocking WS handlers
    setTimeout((): void => {
        if (typeof Audio === 'undefined' || typeof document === 'undefined')
            return;
        if (typeof document.hasFocus === 'function' && document.hasFocus())
            return;

        const me = queryClient.getQueryData<User>(['me']);
        const settings = me?.settings;
        const customSounds = settings?.notificationSounds || [];
        const enabledCustomSounds = customSounds.filter((s) => s.enabled);
        const useDefault = settings?.useDefaultSounds !== false;

        let soundUrl = '';

        if (enabledCustomSounds.length > 0) {
            const randomIndex = Math.floor(
                Math.random() *
                    (enabledCustomSounds.length + (useDefault ? 1 : 0)),
            );
            if (randomIndex < enabledCustomSounds.length) {
                soundUrl = enabledCustomSounds[randomIndex].url;
            } else {
                if (soundQueue.length === 0) {
                    soundQueue = Array.from({ length: 12 }, (_, i) => i + 1);
                    for (let i = soundQueue.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [soundQueue[i], soundQueue[j]] = [
                            soundQueue[j],
                            soundQueue[i],
                        ];
                    }
                }
                const soundIndex = soundQueue.pop()!;
                soundUrl = `/sounds/${soundIndex}.wav`;
            }
        } else if (useDefault) {
            if (soundQueue.length === 0) {
                soundQueue = Array.from({ length: 12 }, (_, i) => i + 1);
                for (let i = soundQueue.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [soundQueue[i], soundQueue[j]] = [
                        soundQueue[j],
                        soundQueue[i],
                    ];
                }
            }
            const soundIndex = soundQueue.pop()!;
            soundUrl = `/sounds/${soundIndex}.wav`;
        } else {
            return;
        }

        const audio = new Audio(soundUrl);
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {});
        }
    }, 0);
};

const syncSoundCache = (user: User | undefined): void => {
    const sounds = user?.settings?.notificationSounds;
    if (!sounds) return;
    const urls = sounds.map((s) => s.url);
    void pruneSoundCache(urls);
    for (const url of urls) {
        void cacheSound(url);
    }
};

/**
 * @description Global WS handlers
 */
export const setupGlobalWsHandlers = (
    queryClient: QueryClient,
    dispatch: Dispatch,
): (() => void) => {
    const me = queryClient.getQueryData<User>(['me']);
    syncSoundCache(me);
    let currentUser: { id: string; username: string } | null = me
        ? { id: me._id, username: me.username }
        : null;

    const cleanups: (() => void)[] = [];

    cleanups.push(
        wsClient.on<IWsErrorEvent>(WsEvents.ERROR, (payload) => {
            console.error('[WS] Global Error:', payload.message);
        }),
    );

    cleanups.push(
        wsClient.on<IWsAuthenticatedEvent>(
            WsEvents.AUTHENTICATED,
            (payload) => {
                if (payload.user) {
                    currentUser = {
                        id: payload.user.id,
                        username: payload.user.username,
                    };
                    dispatch(
                        setUserOnline({
                            userId: payload.user.id,
                            username: payload.user.username,
                            status: undefined,
                        }),
                    );
                    dispatch(setBackendInstanceId(payload.instanceId));
                    serversApi
                        .getUnreadStatus()
                        .then((unreadMap) => {
                            dispatch(setUnreadServers(unreadMap));
                        })
                        .catch(() => {});

                    chatApi
                        .getUnreadCounts()
                        .then((counts) => {
                            dispatch(setUnreadDms(counts));
                        })
                        .catch(() => {});

                    void queryClient.invalidateQueries({ queryKey: ['me'] });
                    void queryClient.invalidateQueries({
                        queryKey: SERVERS_QUERY_KEYS.list,
                    });
                    void queryClient.invalidateQueries({
                        queryKey: FRIENDS_QUERY_KEY,
                    });
                    void queryClient.invalidateQueries({
                        queryKey: FRIEND_PROFILES_QUERY_KEY,
                    });
                    void queryClient.invalidateQueries({
                        queryKey: FRIEND_REQUESTS_QUERY_KEY,
                    });
                    void queryClient.invalidateQueries({
                        queryKey: ['chat', 'messages'],
                    });
                }
            },
        ),
    );

    cleanups.push(
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
        ),
    );

    cleanups.push(
        wsClient.on<{ peerId: string; count: number }>(
            WsEvents.DM_UNREAD_UPDATED,
            (payload) => {
                dispatch(
                    setDmUnread({
                        userId: payload.peerId,
                        count: payload.count,
                    }),
                );
            },
        ),
    );

    cleanups.push(
        wsClient.on<IChannelUnreadUpdatedEvent>(
            WsEvents.CHANNEL_UNREAD_UPDATED,
            (payload) => {
                queryClient.setQueryData<Channel[]>(
                    SERVERS_QUERY_KEYS.channels(payload.serverId),
                    (oldChannels) => {
                        if (!oldChannels) return oldChannels;
                        return oldChannels.map((channel) =>
                            channel._id === payload.channelId
                                ? {
                                      ...channel,
                                      lastMessageAt:
                                          payload.lastMessageAt !== undefined
                                              ? payload.lastMessageAt
                                              : channel.lastMessageAt,
                                      lastReadAt:
                                          payload.lastReadAt ??
                                          channel.lastReadAt,
                                  }
                                : channel,
                        );
                    },
                );

                if (payload.lastMessageAt) {
                    void queryClient.invalidateQueries({
                        queryKey: CHAT_QUERY_KEYS.channelMessages(
                            payload.serverId,
                            payload.channelId,
                            null,
                        ),
                    });
                }
            },
        ),
    );

    cleanups.push(
        wsClient.on<IMessageDm>(WsEvents.MESSAGE_DM, (payload) => {
            addMessageToInfiniteCache(
                queryClient,
                CHAT_QUERY_KEYS.userMessages(payload.senderId),
                convertDmToChatMessage(payload),
            );
            addMessageToInfiniteCache(
                queryClient,
                CHAT_QUERY_KEYS.userMessages(payload.receiverId),
                convertDmToChatMessage(payload),
            );

            if (payload.senderId !== currentUser?.id) {
                playNotificationSound(queryClient);
            }
        }),
    );

    cleanups.push(
        wsClient.on<IMessageServer>(WsEvents.MESSAGE_SERVER, (payload) => {
            addMessageToInfiniteCache(
                queryClient,
                CHAT_QUERY_KEYS.channelMessages(
                    payload.serverId,
                    payload.channelId,
                    null,
                ),
                convertServerMessageToChatMessage(payload),
            );
        }),
    );

    cleanups.push(
        wsClient.on<IMentionEvent>(WsEvents.MENTION, (payload) => {
            if (
                payload.type === 'mention' &&
                payload.senderId !== currentUser?.id
            ) {
                playNotificationSound(queryClient);
            }

            if (payload.serverId) {
                dispatch(incrementServerPing({ serverId: payload.serverId }));
            }

            queryClient.setQueryData<{ pings: PingNotification[] }>(
                ['pings'],
                (old) => {
                    const newPing: PingNotification = {
                        id: payload.message.messageId,
                        type: (payload.type === 'reaction'
                            ? 'system'
                            : 'mention') as PingNotification['type'],
                        sender: payload.sender,
                        senderId: payload.senderId,
                        serverId: payload.serverId,
                        channelId: payload.channelId,
                        message: payload.message as unknown as
                            | PingMentionMessage
                            | PingExportMessage,
                        timestamp: Date.now(),
                    };

                    if (!old) return { pings: [newPing] };

                    if (old.pings.some((p) => p.id === newPing.id)) return old;

                    return {
                        ...old,
                        pings: [newPing, ...old.pings],
                    };
                },
            );
        }),
    );

    cleanups.push(
        wsClient.on<{ sounds: UserSettings['notificationSounds'] }>(
            'notification_sounds_updated',
            (payload) => {
                queryClient.setQueryData<User>(['me'], (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        settings: {
                            ...old.settings,
                            notificationSounds: payload.sounds,
                        },
                    };
                });
                const updatedMe = queryClient.getQueryData<User>(['me']);
                syncSoundCache(updatedMe);
            },
        ),
    );

    cleanups.push(
        wsClient.on<{
            userId: string;
            settings?: UserSettings;
            activeMute?: User['activeMute'];
        }>(WsEvents.USER_UPDATED, (payload) => {
            if (payload.userId === currentUser?.id) {
                queryClient.setQueryData<User>(['me'], (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        ...(payload.settings !== undefined
                            ? {
                                  settings: {
                                      ...old.settings,
                                      ...payload.settings,
                                  },
                              }
                            : {}),
                        ...(Object.prototype.hasOwnProperty.call(
                            payload,
                            'activeMute',
                        )
                            ? { activeMute: payload.activeMute ?? null }
                            : {}),
                    };
                });
                if (
                    Object.prototype.hasOwnProperty.call(payload, 'activeMute')
                ) {
                    void queryClient.invalidateQueries({
                        queryKey: ['me'],
                    });
                }
                const updatedMe = queryClient.getQueryData<User>(['me']);
                syncSoundCache(updatedMe);
            }
        }),
    );

    const upsertFriendAtTop = (friend: Friend): void => {
        [FRIENDS_QUERY_KEY, FRIEND_PROFILES_QUERY_KEY].forEach((queryKey) => {
            queryClient.setQueriesData<Friend[]>({ queryKey }, (old) => {
                if (!old) return old;
                return [
                    friend,
                    ...old.filter(
                        (cachedFriend) => cachedFriend._id !== friend._id,
                    ),
                ];
            });
        });
    };

    const removeFriendFromCaches = (friendId: string): void => {
        [FRIENDS_QUERY_KEY, FRIEND_PROFILES_QUERY_KEY].forEach((queryKey) => {
            queryClient.setQueriesData<Friend[]>({ queryKey }, (old) => {
                if (!old) return old;
                return old.filter((friend) => friend._id !== friendId);
            });
        });
    };

    const upsertChannel = (channel: Channel): void => {
        queryClient.setQueriesData<Channel[]>(
            { queryKey: SERVERS_QUERY_KEYS.channels(channel.serverId) },
            (old) => {
                if (!old) return old;
                return [
                    ...old.filter(
                        (cachedChannel) => cachedChannel._id !== channel._id,
                    ),
                    channel,
                ].sort((a, b) => a.position - b.position);
            },
        );
    };

    cleanups.push(
        wsClient.on<{ friend?: Friend }>(WsEvents.FRIEND_ADDED, (payload) => {
            if (payload.friend) {
                upsertFriendAtTop(payload.friend);
            }
            void queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
            void queryClient.invalidateQueries({
                queryKey: FRIEND_PROFILES_QUERY_KEY,
            });
            void queryClient.invalidateQueries({
                queryKey: FRIEND_REQUESTS_QUERY_KEY,
            });
        }),
    );

    cleanups.push(
        wsClient.on<{ userId?: string }>(WsEvents.FRIEND_REMOVED, (payload) => {
            if (payload.userId) {
                removeFriendFromCaches(payload.userId);
            }
            void queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
            void queryClient.invalidateQueries({
                queryKey: FRIEND_PROFILES_QUERY_KEY,
            });
            void queryClient.invalidateQueries({
                queryKey: FRIEND_REQUESTS_QUERY_KEY,
            });
        }),
    );

    cleanups.push(
        wsClient.on(WsEvents.INCOMING_REQUEST_ADDED, () => {
            void queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
            void queryClient.invalidateQueries({
                queryKey: FRIEND_REQUESTS_QUERY_KEY,
            });
        }),
    );

    cleanups.push(
        wsClient.on(WsEvents.INCOMING_REQUEST_REMOVED, () => {
            void queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
            void queryClient.invalidateQueries({
                queryKey: FRIEND_REQUESTS_QUERY_KEY,
            });
        }),
    );

    cleanups.push(
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
        }),
    );

    cleanups.push(
        wsClient.on<IUserOnlineEvent>(WsEvents.USER_ONLINE, (payload) => {
            dispatch(setUserOnline(payload));
        }),
    );

    cleanups.push(
        wsClient.on<IUserOfflineEvent>(WsEvents.USER_OFFLINE, (payload) => {
            dispatch(setUserOffline(payload));
            dispatch(clearUserFromAllVoiceChannels(payload.userId));
        }),
    );

    cleanups.push(
        wsClient.on<IUserJoinedVoiceEvent>(
            WsEvents.USER_JOINED_VOICE,
            (payload) => {
                dispatch(
                    addVoiceParticipant({
                        channelId: payload.channelId,
                        userId: payload.userId,
                    }),
                );
            },
        ),
    );

    cleanups.push(
        wsClient.on<IUserLeftVoiceEvent>(
            WsEvents.USER_LEFT_VOICE,
            (payload) => {
                dispatch(
                    removeVoiceParticipant({
                        channelId: payload.channelId,
                        userId: payload.userId,
                    }),
                );
            },
        ),
    );

    cleanups.push(
        wsClient.on<IVoiceJoinedEvent>(WsEvents.VOICE_JOINED, (payload) => {
            dispatch(
                setVoiceParticipants({
                    channelId: payload.channelId,
                    userIds: payload.participants ?? [],
                }),
            );
            if (payload.voiceStates) {
                Object.entries(payload.voiceStates).forEach(
                    ([userId, state]) => {
                        dispatch(
                            setVoiceUserState({
                                userId,
                                isMuted: state.isMuted,
                                isDeafened: state.isDeafened,
                            }),
                        );
                    },
                );
            }
        }),
    );

    cleanups.push(
        wsClient.on<IVoiceStateUpdatedEvent>(
            WsEvents.VOICE_STATE_UPDATED,
            (payload) => {
                dispatch(
                    setVoiceUserState({
                        userId: payload.userId,
                        isMuted: payload.isMuted,
                        isDeafened: payload.isDeafened,
                    }),
                );

                if (payload.channelId) {
                    dispatch(
                        addVoiceParticipant({
                            channelId: payload.channelId,
                            userId: payload.userId,
                        }),
                    );
                }
            },
        ),
    );

    cleanups.push(
        wsClient.on<IStatusUpdatedEvent>(WsEvents.STATUS_UPDATED, (payload) => {
            dispatch(
                updateUserStatusByUsername({
                    username: payload.username,
                    customStatus: payload.status,
                }),
            );

            if (currentUser && payload.username === currentUser.username) {
                queryClient.setQueryData<User>(['me'], (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        customStatus: payload.status
                            ? {
                                  text: payload.status.text,
                                  emoji: payload.status.emoji || undefined,
                                  expiresAt: payload.status.expiresAt
                                      ? new Date(payload.status.expiresAt)
                                      : null,
                                  updatedAt: new Date(payload.status.updatedAt),
                              }
                            : null,
                    };
                });
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
                                      customStatus: payload.status
                                          ? {
                                                text: payload.status.text,
                                                emoji:
                                                    payload.status.emoji ||
                                                    undefined,
                                                expiresAt: payload.status
                                                    .expiresAt
                                                    ? new Date(
                                                          payload.status
                                                              .expiresAt,
                                                      )
                                                    : null,
                                                updatedAt: new Date(
                                                    payload.status.updatedAt,
                                                ),
                                            }
                                          : null,
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
                            ? {
                                  ...friend,
                                  customStatus: payload.status
                                      ? {
                                            text: payload.status.text,
                                            emoji:
                                                payload.status.emoji ||
                                                undefined,
                                        }
                                      : null,
                              }
                            : friend,
                    );
                },
            );
        }),
    );

    cleanups.push(
        wsClient.on<IUserUpdatedEvent>(WsEvents.USER_UPDATED, (payload) => {
            const isMe =
                payload.senderId === currentUser?.id ||
                payload.userId === currentUser?.id;

            if (isMe) {
                void queryClient.invalidateQueries({ queryKey: ['me'] });
            }
            void queryClient.invalidateQueries({
                queryKey: ['user', payload.userId],
            });

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
        }),
    );

    cleanups.push(
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
        ),
    );

    cleanups.push(
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
                                ? {
                                      ...friend,
                                      displayName: payload.displayName,
                                  }
                                : friend,
                        );
                    },
                );
            },
        ),
    );

    cleanups.push(
        wsClient.on<IMemberUpdatedEvent>(WsEvents.MEMBER_UPDATED, (payload) => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.members(payload.serverId),
            });
            if (currentUser && payload.userId === currentUser.id) {
                void queryClient.invalidateQueries({ queryKey: ['me'] });
            }
        }),
    );

    cleanups.push(
        wsClient.on<IMemberAddedEvent>(WsEvents.MEMBER_ADDED, (payload) => {
            if (currentUser && payload.userId === currentUser.id) {
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.list,
                });
            }
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.members(payload.serverId),
            });
        }),
    );

    cleanups.push(
        wsClient.on<IRoleEvent>(WsEvents.ROLE_CREATED, (payload) => {
            if (payload.senderId === currentUser?.id) return;
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.roles(payload.serverId),
            });
        }),
    );

    cleanups.push(
        wsClient.on<IRoleEvent>(WsEvents.ROLE_UPDATED, (payload) => {
            if (payload.senderId === currentUser?.id) return;
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.roles(payload.serverId),
            });
        }),
    );

    cleanups.push(
        wsClient.on<IRoleDeletedEvent>(WsEvents.ROLE_DELETED, (payload) => {
            if (payload.senderId === currentUser?.id) return;
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.roles(payload.serverId),
            });
        }),
    );

    cleanups.push(
        wsClient.on<IRolesReorderedEvent>(
            WsEvents.ROLES_REORDERED,
            (payload) => {
                if (payload.senderId === currentUser?.id) return;
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.roles(payload.serverId),
                });
            },
        ),
    );

    cleanups.push(
        wsClient.on<IChannelEvent>(WsEvents.CHANNEL_CREATED, (payload) => {
            upsertChannel(payload.channel);
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.channels(payload.serverId),
            });
        }),
    );

    cleanups.push(
        wsClient.on<IChannelEvent>(WsEvents.CHANNEL_UPDATED, (payload) => {
            if (payload.senderId === currentUser?.id) return;
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.channels(payload.serverId),
            });
        }),
    );

    cleanups.push(
        wsClient.on<IChannelDeletedEvent>(
            WsEvents.CHANNEL_DELETED,
            (payload) => {
                if (payload.senderId === currentUser?.id) return;
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.channels(payload.serverId),
                });
            },
        ),
    );

    cleanups.push(
        wsClient.on<IChannelsReorderedEvent>(
            WsEvents.CHANNELS_REORDERED,
            (payload) => {
                if (payload.senderId === currentUser?.id) return;
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.channels(payload.serverId),
                });
            },
        ),
    );

    cleanups.push(
        wsClient.on<ICategoryEvent>(WsEvents.CATEGORY_CREATED, (payload) => {
            if (payload.senderId === currentUser?.id) return;
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.categories(payload.serverId),
            });
        }),
    );

    cleanups.push(
        wsClient.on<ICategoryEvent>(WsEvents.CATEGORY_UPDATED, (payload) => {
            if (payload.senderId === currentUser?.id) return;
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.categories(payload.serverId),
            });
        }),
    );

    cleanups.push(
        wsClient.on<ICategoryDeletedEvent>(
            WsEvents.CATEGORY_DELETED,
            (payload) => {
                if (payload.senderId === currentUser?.id) return;
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.categories(payload.serverId),
                });
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.channels(payload.serverId),
                });
            },
        ),
    );

    cleanups.push(
        wsClient.on<ICategoriesReorderedEvent>(
            WsEvents.CATEGORIES_REORDERED,
            (payload) => {
                if (payload.senderId === currentUser?.id) return;
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.categories(payload.serverId),
                });
            },
        ),
    );

    cleanups.push(
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
        ),
    );

    cleanups.push(
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
        ),
    );

    cleanups.push(
        wsClient.on<IServerJoinedEvent>(WsEvents.SERVER_JOINED, (payload) => {
            if (payload.voiceStates) {
                Object.entries(
                    payload.voiceStates as Record<string, string[]>,
                ).forEach(([channelId, userIds]) => {
                    dispatch(setVoiceParticipants({ channelId, userIds }));
                });
            }
        }),
    );

    cleanups.push(
        wsClient.on<IServerUpdatedEvent>(WsEvents.SERVER_UPDATED, (payload) => {
            if (payload.senderId === currentUser?.id) return;
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.details(payload.serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.list,
            });
        }),
    );

    cleanups.push(
        wsClient.on<{ serverId: string; senderId?: string }>(
            WsEvents.SERVER_DELETED,
            (payload) => {
                if (payload.senderId === currentUser?.id) return;
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.list,
                });
            },
        ),
    );

    cleanups.push(
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
        ),
    );

    cleanups.push(
        wsClient.on<IServerBannerUpdatedEvent>(
            WsEvents.SERVER_BANNER_UPDATED,
            (payload) => {
                if (payload.senderId === currentUser?.id) return;
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.details(payload.serverId),
                });
            },
        ),
    );

    cleanups.push(
        wsClient.on<IOwnershipTransferredEvent>(
            WsEvents.OWNERSHIP_TRANSFERRED,
            (payload) => {
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.details(payload.serverId),
                });
            },
        ),
    );

    cleanups.push(
        wsClient.on<IMemberRemovedEvent>(WsEvents.MEMBER_REMOVED, (payload) => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.members(payload.serverId),
            });
            if (currentUser && payload.userId === currentUser.id) {
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.list,
                });
            }
        }),
    );

    // Emoji events
    cleanups.push(
        wsClient.on<IEmojiUpdatedEvent>(WsEvents.EMOJI_UPDATED, (payload) => {
            if (payload.senderId === currentUser?.id) return;
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.emojis(payload.serverId),
            });
        }),
    );

    // Message editing events
    cleanups.push(
        wsClient.on<{
            messageId: string;
            serverId: string;
            channelId: string;
            text: string;
            editedAt: string;
            isEdited: boolean;
            attachments?: ChatMessage['attachments'];
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
                                      attachments:
                                          payload.attachments ??
                                          msg.attachments,
                                  }
                                : msg,
                        ),
                    ),
                });
            }
        }),
    );

    cleanups.push(
        wsClient.on<{
            messageId: string;
            senderId: string;
            receiverId: string;
            text: string;
            editedAt: string;
            isEdited: boolean;
            attachments?: ChatMessage['attachments'];
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
                                          attachments:
                                              payload.attachments ??
                                              msg.attachments,
                                      }
                                    : msg,
                            ),
                        ),
                    });
                }
            });
        }),
    );

    cleanups.push(
        wsClient.on(WsEvents.DISCONNECTED, () => {
            // We consciously do not invalidate active queries here to avoid
            // triggering a giant fetch storm while the network might be down.
            // Queries will be automatically invalidated on the AUTHENTICATED event.
        }),
    );

    return () => {
        cleanups.forEach((cleanup) => cleanup());
    };
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
