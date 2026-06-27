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
import { COMMANDS_QUERY_KEYS } from '@/api/interactions/interactions.queries';
import type {
    PingExportMessage,
    PingMentionMessage,
    PingNotification,
} from '@/api/pings/pings.types';
import { serversApi } from '@/api/servers/servers.api';
import { SERVERS_QUERY_KEYS } from '@/api/servers/servers.queries';
import type {
    Channel,
    Server,
    ServerMember,
} from '@/api/servers/servers.types';
import type { User, UserSettings } from '@/api/users/users.types';
import type { RootState } from '@/store';
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
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { showInAppNotification } from '@/ui/notifications/inAppNotifications';
import { getValidMessageInteraction } from '@/ui/utils/chat';
import { playAudio } from '@/utils/notificationAudio';
import { cacheSound, pruneSoundCache } from '@/utils/soundCache';

import { wsClient } from './client';
import {
    type ICategoriesReorderedEvent,
    type ICategoryDeletedEvent,
    type ICategoryEvent,
    type IChannelDeletedEvent,
    type IChannelEvent,
    type IChannelsReorderedEvent,
    type ICommandsUpdatedEvent,
    type IDisplayNameUpdatedEvent,
    type IEmojiUpdatedEvent,
    type IInteractionResponseServerEvent,
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
const shownInAppNotificationIds = new Set<string>();

interface IChannelUnreadUpdatedEvent {
    serverId: string;
    channelId: string;
    lastMessageAt?: string | null;
    lastReadAt?: string;
    senderId?: string;
}

const mergeIfChanged = <T extends object>(item: T, patch: Partial<T>): T => {
    const record = item as Record<string, unknown>;
    for (const [key, value] of Object.entries(patch)) {
        if (record[key] !== value) {
            return { ...item, ...patch };
        }
    }

    return item;
};

const updateCachedFriend = <T extends Friend | User>(
    old: T[] | undefined,
    friendId: string,
    update: (friend: T) => T,
): T[] | undefined => {
    if (!old) return old;

    let changed = false;
    const next = old.map((friend): T => {
        if (friend.id !== friendId) return friend;
        const updated = update(friend);
        if (updated !== friend) changed = true;
        return updated;
    });

    return changed ? next : old;
};

const addMessageToInfiniteCache = (
    queryClient: QueryClient,
    queryKey: readonly unknown[],
    newMessage: ChatMessage,
): void => {
    queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
        queryKey,
        (oldData): InfiniteData<ChatMessage[], unknown> | undefined => {
            if (!oldData) return oldData;

            const firstPage = oldData.pages[0] || [];
            if (firstPage.some((msg): boolean => msg.id === newMessage.id)) {
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
    id: message.id ?? message.messageId,
    text: message.text,
    createdAt: message.createdAt,
    senderId: message.senderId,
    senderProfilePicture:
        message.senderProfilePicture ??
        getStringField(message, [
            'senderAvatarUrl',
            'senderAvatarURL',
            'senderAvatar',
            'avatarUrl',
            'avatarURL',
            'avatar',
            'profilePicture',
        ]),
    receiverId: message.receiverId,
    replyToId: message.replyToId,
    repliedTo: message.repliedTo,
    isEdited: message.isEdited,
    isPinned: message.isPinned,
    isSticky: message.isSticky,
    isWebhook: message.isWebhook,
    stickerId: message.stickerId,
    poll: message.poll,
    embeds: message.embeds,
    attachments: message.attachments,
    reactions: message.reactions,
    interaction: null,
    senderIsBot: message.senderIsBot,
});

const convertServerMessageToChatMessage = (
    message: IMessageServer,
): ChatMessage => ({
    id: message.id ?? message.messageId,
    text: message.text,
    createdAt: message.createdAt,
    senderId: message.senderId,
    serverId: message.serverId,
    channelId: message.channelId,
    replyToId: message.replyToId,
    senderProfilePicture:
        message.senderProfilePicture ??
        getStringField(message, [
            'senderAvatarUrl',
            'senderAvatarURL',
            'senderAvatar',
            'avatarUrl',
            'avatarURL',
            'avatar',
            'profilePicture',
        ]),
    isEdited: message.isEdited,
    isPinned: message.isPinned,
    isSticky: message.isSticky,
    isWebhook: message.isWebhook,
    webhookUsername: message.webhookUsername,
    webhookAvatarUrl: message.webhookAvatarUrl,
    embeds: message.embeds,
    attachments: message.attachments,
    reactions: message.reactions,
    interaction: getValidMessageInteraction(
        message.interaction
            ? {
                  command: message.interaction.command,
                  options: message.interaction.options as NonNullable<
                      ChatMessage['interaction']
                  >['options'],
                  user: message.interaction.user,
              }
            : null,
    ),
    stickerId: message.stickerId,
    poll: message.poll,
    senderIsBot: message.senderIsBot,
});

const playNotificationSound = (queryClient: QueryClient): void => {
    // Run asynchronously to allow for better stacking and prevent blocking WS handlers
    setTimeout((): void => {
        if (typeof Audio === 'undefined') return;

        const me = queryClient.getQueryData<User>(['me']);
        const settings = me?.settings;
        const customSounds = settings?.notificationSounds || [];
        const enabledCustomSounds = customSounds.filter(
            (s): boolean => s.enabled,
        );
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
                    soundQueue = Array.from(
                        { length: 12 },
                        (_, i): number => i + 1,
                    );
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
                soundQueue = Array.from(
                    { length: 12 },
                    (_, i): number => i + 1,
                );
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

        void playAudio(soundUrl);
    }, 0);
};

const normalizeNotificationText = (text: string | undefined): string => {
    const normalized = (text ?? '').replace(/\s+/g, ' ').trim();
    if (!normalized) return 'Sent an attachment or embed.';
    return normalized;
};

const getStringField = (
    value: unknown,
    fields: readonly string[],
): string | undefined => {
    if (!value || typeof value !== 'object') return undefined;
    const record = value as Record<string, unknown>;

    for (const field of fields) {
        const fieldValue = record[field];
        if (typeof fieldValue === 'string' && fieldValue.trim()) {
            return fieldValue;
        }
    }

    return undefined;
};

const resolveNotificationProfilePicture = (
    queryClient: QueryClient,
    message: ChatMessage,
): string | undefined => {
    const cachedUser = queryClient.getQueryData<User>([
        'user',
        message.senderId,
    ]);
    if (cachedUser?.profilePicture) return cachedUser.profilePicture;

    const friendProfiles =
        queryClient.getQueryData<User[]>(FRIEND_PROFILES_QUERY_KEY) ?? [];
    const friendProfile = friendProfiles.find(
        (friend): boolean => friend.id === message.senderId,
    );
    if (friendProfile?.profilePicture) return friendProfile.profilePicture;

    const friends = queryClient.getQueryData<Friend[]>(FRIENDS_QUERY_KEY) ?? [];
    const friend = friends.find(
        (friendItem): boolean => friendItem.id === message.senderId,
    );
    if (friend?.profilePicture) return friend.profilePicture;

    if (message.serverId) {
        const members =
            queryClient.getQueryData<ServerMember[]>(
                SERVERS_QUERY_KEYS.members(message.serverId),
            ) ?? [];
        const member = members.find(
            (serverMember): boolean => serverMember.userId === message.senderId,
        );
        if (member?.user?.profilePicture) return member.user.profilePicture;
    }

    return (
        message.senderProfilePicture ??
        getStringField(message, [
            'senderAvatarUrl',
            'senderAvatarURL',
            'senderAvatar',
            'avatarUrl',
            'avatarURL',
            'avatar',
            'profilePicture',
        ])
    );
};

const buildNotificationUser = ({
    id,
    username,
    profilePicture,
}: {
    id: string;
    username?: string;
    profilePicture?: string | null;
}): User => ({
    id: id,
    login: username || 'Unknown',
    username: username || 'Unknown',
    displayName: username || 'Unknown',
    profilePicture: profilePicture ?? undefined,
    createdAt: new Date(),
});

const buildNotificationMessage = (
    queryClient: QueryClient,
    message: ChatMessage,
    username?: string,
): ProcessedChatMessage => ({
    ...message,
    id: message.id || `notification-${message.senderId}-${message.createdAt}`,
    text: message.text ?? '',
    createdAt: message.createdAt || new Date().toISOString(),
    stickerId: message.stickerId ?? null,
    isEdited: message.isEdited ?? false,
    isPinned: message.isPinned ?? false,
    isSticky: message.isSticky ?? false,
    isWebhook: message.isWebhook ?? false,
    embeds: message.embeds ?? [],
    attachments: message.attachments ?? [],
    reactions: message.reactions ?? [],
    interaction: message.interaction ?? null,
    poll: message.poll ?? null,
    senderIsBot: message.senderIsBot ?? false,
    user: buildNotificationUser({
        id: message.senderId,
        username,
        profilePicture: resolveNotificationProfilePicture(queryClient, message),
    }),
});

const showDedupedInAppNotification = ({
    id,
    kind,
    title,
    serverIcon,
    serverName,
    chatMessage,
    message,
}: {
    id: string;
    kind: 'dm' | 'mention';
    title: string;
    serverIcon?: string;
    serverName?: string;
    chatMessage: ProcessedChatMessage;
    message: string;
}): void => {
    if (shownInAppNotificationIds.has(id)) return;
    shownInAppNotificationIds.add(id);

    if (shownInAppNotificationIds.size > 200) {
        const first = shownInAppNotificationIds.values().next().value as
            | string
            | undefined;
        if (first) shownInAppNotificationIds.delete(first);
    }

    showInAppNotification({
        id,
        kind,
        chatMessage,
        serverIcon,
        serverName,
        title,
        message,
        type: 'info',
    });
};

const syncSoundCache = (user: User | undefined): void => {
    const sounds = user?.settings?.notificationSounds;
    if (!sounds) return;
    const urls = sounds.map((s): string => s.url);
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
    getState?: () => RootState,
): (() => void) => {
    const me = queryClient.getQueryData<User>(['me']);
    syncSoundCache(me);
    let currentUser: { id: string; username: string } | null = me
        ? { id: me.id, username: me.username }
        : null;

    const cleanups: (() => void)[] = [];

    const isReadingChannel = (
        serverId?: string,
        channelId?: string,
    ): boolean => {
        if (!serverId || !channelId || !getState) return false;
        if (!document.hasFocus()) return false;

        const { nav } = getState();
        const isSelectedChannel =
            nav.selectedServerId === serverId &&
            nav.selectedChannelId === channelId;
        if (isSelectedChannel) return true;

        return Object.values(nav.splitView).some(
            (conversation): boolean =>
                conversation?.type === 'channel' &&
                conversation.serverId === serverId &&
                conversation.channelId === channelId,
        );
    };

    const isReadingDm = (friendId: string): boolean => {
        if (!getState) return false;
        if (!document.hasFocus()) return false;

        const { nav } = getState();
        if (nav.selectedFriendId === friendId) return true;

        return Object.values(nav.splitView).some(
            (conversation): boolean =>
                conversation?.type === 'dm' &&
                conversation.friendId === friendId,
        );
    };

    cleanups.push(
        wsClient.on<IWsErrorEvent>(WsEvents.ERROR, (payload): void => {
            console.error('[WS] Global Error:', payload.message);
        }),
    );

    cleanups.push(
        wsClient.on<IWsAuthenticatedEvent>(
            WsEvents.AUTHENTICATED,
            (payload): void => {
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
                        .then((unreadMap): void => {
                            dispatch(setUnreadServers(unreadMap));
                        })
                        .catch((): void => {});

                    chatApi
                        .getUnreadCounts()
                        .then((counts): void => {
                            dispatch(setUnreadDms(counts));
                        })
                        .catch((): void => {});

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
            (payload): void => {
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
            (payload): void => {
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
            (payload): void => {
                queryClient.setQueryData<Channel[]>(
                    SERVERS_QUERY_KEYS.channels(payload.serverId),
                    (oldChannels): Channel[] | undefined => {
                        if (!oldChannels) return oldChannels;
                        return oldChannels.map(
                            (channel): Channel =>
                                channel.id === payload.channelId
                                    ? {
                                          ...channel,
                                          lastMessageAt:
                                              payload.lastMessageAt !==
                                              undefined
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
        wsClient.on<IMessageDm>(WsEvents.MESSAGE_DM, (payload): void => {
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

            if (
                payload.senderId !== currentUser?.id &&
                !isReadingDm(payload.senderId)
            ) {
                playNotificationSound(queryClient);
                showDedupedInAppNotification({
                    id: `dm-${payload.id ?? payload.messageId}`,
                    kind: 'dm',
                    title: '',
                    chatMessage: buildNotificationMessage(
                        queryClient,
                        convertDmToChatMessage(payload),
                        payload.senderUsername,
                    ),
                    message: normalizeNotificationText(payload.text),
                });
            }
        }),
    );

    cleanups.push(
        wsClient.on<IMessageServer>(
            WsEvents.MESSAGE_SERVER,
            (payload): void => {
                addMessageToInfiniteCache(
                    queryClient,
                    CHAT_QUERY_KEYS.channelMessages(
                        payload.serverId,
                        payload.channelId,
                        null,
                    ),
                    convertServerMessageToChatMessage(payload),
                );
            },
        ),
    );

    cleanups.push(
        wsClient.on<IInteractionResponseServerEvent>(
            WsEvents.INTERACTION_RESPONSE_SERVER,
            (payload): void => {
                if (!currentUser) return;

                const dummyMessage: ChatMessage = {
                    id: `ephemeral-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    serverId: payload.serverId,
                    channelId: payload.channelId,
                    text: payload.text,
                    createdAt: new Date().toISOString(),
                    senderId: payload.senderId ?? currentUser.id,
                    senderUsername: payload.senderUsername,
                    senderProfilePicture: payload.senderProfilePicture,
                    senderIsBot: payload.senderIsBot ?? false,
                    isEdited: false,
                    isPinned: false,
                    isSticky: false,
                    isWebhook: false,
                    embeds: payload.embeds ?? [],
                    components: payload.components ?? [],
                    attachments: [],
                    reactions: [],
                    interaction: null,
                    poll: null,
                    stickerId: null,
                    isEphemeral: true,
                    invocationId: payload.invocationId,
                };

                addMessageToInfiniteCache(
                    queryClient,
                    CHAT_QUERY_KEYS.channelMessages(
                        payload.serverId,
                        payload.channelId,
                        null,
                    ),
                    dummyMessage,
                );
            },
        ),
    );

    cleanups.push(
        wsClient.on<IMentionEvent>(WsEvents.MENTION, (payload): void => {
            if (
                payload.type === 'mention' &&
                payload.senderId !== currentUser?.id &&
                !isReadingChannel(payload.serverId, payload.channelId)
            ) {
                const servers = queryClient.getQueryData<Server[]>(
                    SERVERS_QUERY_KEYS.list,
                );
                const server = payload.serverId
                    ? servers?.find(
                          (candidate): boolean =>
                              candidate.id === payload.serverId,
                      )
                    : undefined;
                playNotificationSound(queryClient);
                showDedupedInAppNotification({
                    id: `mention-${payload.message.messageId}`,
                    kind: 'mention',
                    title: server
                        ? `${payload.sender} mentioned you in ${server.name}`
                        : '',
                    serverIcon: server?.icon,
                    serverName: server?.name,
                    chatMessage: buildNotificationMessage(
                        queryClient,
                        'serverId' in payload.message &&
                            !!payload.message.serverId
                            ? convertServerMessageToChatMessage(
                                  payload.message as IMessageServer,
                              )
                            : convertDmToChatMessage(
                                  payload.message as IMessageDm,
                              ),
                        payload.sender,
                    ),
                    message: normalizeNotificationText(payload.message.text),
                });
            }

            if (payload.serverId) {
                dispatch(incrementServerPing({ serverId: payload.serverId }));
            }

            queryClient.setQueryData<{ pings: PingNotification[] }>(
                ['pings'],
                (old): { pings: PingNotification[] } => {
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

                    if (old.pings.some((p): boolean => p.id === newPing.id))
                        return old;

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
            (payload): void => {
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
            decorationId?: string | null;
        }>(WsEvents.USER_UPDATED, (payload): void => {
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
                        ...(Object.prototype.hasOwnProperty.call(
                            payload,
                            'decorationId',
                        )
                            ? {
                                  decorationId:
                                      payload.decorationId ?? undefined,
                              }
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
        [FRIENDS_QUERY_KEY, FRIEND_PROFILES_QUERY_KEY].forEach(
            (queryKey): void => {
                queryClient.setQueriesData<Friend[]>(
                    { queryKey },
                    (old): Friend[] | undefined => {
                        if (!old) return old;
                        return [
                            friend,
                            ...old.filter(
                                (cachedFriend): boolean =>
                                    cachedFriend.id !== friend.id,
                            ),
                        ];
                    },
                );
            },
        );
    };

    const removeFriendFromCaches = (friendId: string): void => {
        [FRIENDS_QUERY_KEY, FRIEND_PROFILES_QUERY_KEY].forEach(
            (queryKey): void => {
                queryClient.setQueriesData<Friend[]>(
                    { queryKey },
                    (old): Friend[] | undefined => {
                        if (!old) return old;
                        return old.filter(
                            (friend): boolean => friend.id !== friendId,
                        );
                    },
                );
            },
        );
    };

    const upsertChannel = (channel: Channel): void => {
        queryClient.setQueriesData<Channel[]>(
            { queryKey: SERVERS_QUERY_KEYS.channels(channel.serverId) },
            (old): Channel[] | undefined => {
                if (!old) return old;
                return [
                    ...old.filter(
                        (cachedChannel): boolean =>
                            cachedChannel.id !== channel.id,
                    ),
                    channel,
                ].sort((a, b): number => a.position - b.position);
            },
        );
    };

    cleanups.push(
        wsClient.on<{ friend?: Friend }>(
            WsEvents.FRIEND_ADDED,
            (payload): void => {
                if (payload.friend) {
                    upsertFriendAtTop(payload.friend);
                }
                void queryClient.invalidateQueries({
                    queryKey: FRIENDS_QUERY_KEY,
                });
                void queryClient.invalidateQueries({
                    queryKey: FRIEND_PROFILES_QUERY_KEY,
                });
                void queryClient.invalidateQueries({
                    queryKey: FRIEND_REQUESTS_QUERY_KEY,
                });
            },
        ),
    );

    cleanups.push(
        wsClient.on<{ userId?: string }>(
            WsEvents.FRIEND_REMOVED,
            (payload): void => {
                if (payload.userId) {
                    removeFriendFromCaches(payload.userId);
                }
                void queryClient.invalidateQueries({
                    queryKey: FRIENDS_QUERY_KEY,
                });
                void queryClient.invalidateQueries({
                    queryKey: FRIEND_PROFILES_QUERY_KEY,
                });
                void queryClient.invalidateQueries({
                    queryKey: FRIEND_REQUESTS_QUERY_KEY,
                });
            },
        ),
    );

    cleanups.push(
        wsClient.on<{ friendId: string; isPinned: boolean }>(
            WsEvents.FRIEND_PIN_UPDATED,
            (payload): void => {
                [FRIENDS_QUERY_KEY, FRIEND_PROFILES_QUERY_KEY].forEach(
                    (queryKey): void => {
                        queryClient.setQueriesData<Friend[]>(
                            { queryKey },
                            (old): Friend[] | undefined =>
                                old?.map(
                                    (f): Friend =>
                                        f.id === payload.friendId
                                            ? {
                                                  ...f,
                                                  isPinned: payload.isPinned,
                                              }
                                            : f,
                                ),
                        );
                    },
                );
            },
        ),
    );

    cleanups.push(
        wsClient.on(WsEvents.INCOMING_REQUEST_ADDED, (): void => {
            void queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
            void queryClient.invalidateQueries({
                queryKey: FRIEND_REQUESTS_QUERY_KEY,
            });
        }),
    );

    cleanups.push(
        wsClient.on(WsEvents.INCOMING_REQUEST_REMOVED, (): void => {
            void queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
            void queryClient.invalidateQueries({
                queryKey: FRIEND_REQUESTS_QUERY_KEY,
            });
        }),
    );

    cleanups.push(
        wsClient.on<IPresenceSyncEvent>(
            WsEvents.PRESENCE_SYNC,
            (payload): void => {
                const onlineUsers = [...payload.online];
                const me = queryClient.getQueryData<{ id: string }>(['me']);

                if (
                    me &&
                    !onlineUsers.some((u): boolean => u.userId === me.id)
                ) {
                    onlineUsers.push({
                        userId: me.id,
                        username: (me as unknown as User).username || '',
                        status: undefined,
                    });
                }

                dispatch(setOnlineUsers(onlineUsers));
            },
        ),
    );

    cleanups.push(
        wsClient.on<IUserOnlineEvent>(WsEvents.USER_ONLINE, (payload): void => {
            dispatch(setUserOnline(payload));
        }),
    );

    cleanups.push(
        wsClient.on<IUserOfflineEvent>(
            WsEvents.USER_OFFLINE,
            (payload): void => {
                dispatch(setUserOffline(payload));
                dispatch(clearUserFromAllVoiceChannels(payload.userId));
            },
        ),
    );

    cleanups.push(
        wsClient.on<IUserJoinedVoiceEvent>(
            WsEvents.USER_JOINED_VOICE,
            (payload): void => {
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
            (payload): void => {
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
        wsClient.on<IVoiceJoinedEvent>(
            WsEvents.VOICE_JOINED,
            (payload): void => {
                dispatch(
                    setVoiceParticipants({
                        channelId: payload.channelId,
                        userIds: payload.participants ?? [],
                    }),
                );
                if (payload.voiceStates) {
                    Object.entries(payload.voiceStates).forEach(
                        ([userId, state]): void => {
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
            },
        ),
    );

    cleanups.push(
        wsClient.on<IVoiceStateUpdatedEvent>(
            WsEvents.VOICE_STATE_UPDATED,
            (payload): void => {
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
        wsClient.on<IStatusUpdatedEvent>(
            WsEvents.STATUS_UPDATED,
            (payload): void => {
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
                                      updatedAt: new Date(
                                          payload.status.updatedAt,
                                      ),
                                  }
                                : null,
                        };
                    });
                }

                queryClient.setQueriesData<ServerMember[]>(
                    { queryKey: ['servers', 'members'] },
                    (old): ServerMember[] | undefined => {
                        if (!old) return old;
                        return old.map(
                            (member): ServerMember =>
                                member.user.username === payload.username
                                    ? {
                                          ...member,
                                          user: {
                                              ...member.user,
                                              customStatus: payload.status
                                                  ? {
                                                        text: payload.status
                                                            .text,
                                                        emoji:
                                                            payload.status
                                                                .emoji ||
                                                            undefined,
                                                        expiresAt: payload
                                                            .status.expiresAt
                                                            ? new Date(
                                                                  payload.status
                                                                      .expiresAt,
                                                              )
                                                            : null,
                                                        updatedAt: new Date(
                                                            payload.status
                                                                .updatedAt,
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
                    (old): Friend[] | undefined => {
                        if (!old) return old;

                        let changed = false;
                        const customStatus = payload.status
                            ? {
                                  text: payload.status.text,
                                  emoji: payload.status.emoji || undefined,
                              }
                            : null;
                        const next = old.map((friend): Friend => {
                            if (friend.username !== payload.username) {
                                return friend;
                            }

                            if (
                                friend.customStatus?.text ===
                                    customStatus?.text &&
                                friend.customStatus?.emoji ===
                                    customStatus?.emoji
                            ) {
                                return friend;
                            }

                            changed = true;
                            return { ...friend, customStatus };
                        });

                        return changed ? next : old;
                    },
                );

                queryClient.setQueriesData<User[]>(
                    { queryKey: FRIEND_PROFILES_QUERY_KEY },
                    (old): User[] | undefined => {
                        if (!old) return old;

                        let changed = false;
                        const customStatus = payload.status
                            ? {
                                  text: payload.status.text,
                                  emoji: payload.status.emoji || undefined,
                                  expiresAt: payload.status.expiresAt
                                      ? new Date(payload.status.expiresAt)
                                      : null,
                                  updatedAt: new Date(payload.status.updatedAt),
                              }
                            : null;
                        const next = old.map((friend): User => {
                            if (friend.username !== payload.username) {
                                return friend;
                            }

                            if (
                                friend.customStatus?.text ===
                                    customStatus?.text &&
                                friend.customStatus?.emoji ===
                                    customStatus?.emoji
                            ) {
                                return friend;
                            }

                            changed = true;
                            return { ...friend, customStatus };
                        });

                        return changed ? next : old;
                    },
                );
            },
        ),
    );

    cleanups.push(
        wsClient.on<IUserUpdatedEvent>(
            WsEvents.USER_UPDATED,
            (payload): void => {
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
                    (old): ServerMember[] | undefined => {
                        if (!old) return old;
                        return old.map(
                            (member): ServerMember =>
                                member.userId === payload.userId
                                    ? {
                                          ...member,
                                          user: {
                                              ...member.user,
                                              ...payload,
                                          } as User,
                                      }
                                    : member,
                        );
                    },
                );

                queryClient.setQueriesData<Friend[]>(
                    { queryKey: FRIENDS_QUERY_KEY },
                    (old): Friend[] | undefined =>
                        updateCachedFriend(old, payload.userId, (friend) =>
                            mergeIfChanged(friend, payload),
                        ),
                );

                queryClient.setQueriesData<User[]>(
                    { queryKey: FRIEND_PROFILES_QUERY_KEY },
                    (old): User[] | undefined =>
                        updateCachedFriend(old, payload.userId, (friend) =>
                            mergeIfChanged(
                                friend,
                                payload as unknown as Partial<User>,
                            ),
                        ),
                );
            },
        ),
    );

    cleanups.push(
        wsClient.on<IUserBannerUpdatedEvent>(
            WsEvents.USER_BANNER_UPDATED,
            (payload): void => {
                void queryClient.invalidateQueries({ queryKey: ['user'] });
                if (currentUser && payload.username === currentUser.username) {
                    void queryClient.invalidateQueries({ queryKey: ['me'] });
                }

                queryClient.setQueriesData<ServerMember[]>(
                    { queryKey: ['servers', 'members'] },
                    (old): ServerMember[] | undefined => {
                        if (!old) return old;
                        return old.map(
                            (member): ServerMember =>
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
            (payload): void => {
                void queryClient.invalidateQueries({ queryKey: ['user'] });
                if (currentUser && payload.username === currentUser.username) {
                    void queryClient.invalidateQueries({ queryKey: ['me'] });
                }

                queryClient.setQueriesData<ServerMember[]>(
                    { queryKey: ['servers', 'members'] },
                    (old): ServerMember[] | undefined => {
                        if (!old) return old;
                        return old.map(
                            (member): ServerMember =>
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
                    (old): Friend[] | undefined => {
                        if (!old) return old;

                        let changed = false;
                        const next = old.map((friend): Friend => {
                            if (friend.username !== payload.username) {
                                return friend;
                            }

                            const updated = mergeIfChanged(friend, {
                                displayName: payload.displayName,
                            });
                            if (updated !== friend) changed = true;
                            return updated;
                        });

                        return changed ? next : old;
                    },
                );

                queryClient.setQueriesData<User[]>(
                    { queryKey: FRIEND_PROFILES_QUERY_KEY },
                    (old): User[] | undefined => {
                        if (!old) return old;

                        let changed = false;
                        const next = old.map((friend): User => {
                            if (friend.username !== payload.username) {
                                return friend;
                            }

                            const updated = mergeIfChanged(friend, {
                                displayName: payload.displayName,
                            });
                            if (updated !== friend) changed = true;
                            return updated;
                        });

                        return changed ? next : old;
                    },
                );
            },
        ),
    );

    cleanups.push(
        wsClient.on<IMemberUpdatedEvent>(
            WsEvents.MEMBER_UPDATED,
            (payload): void => {
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.members(payload.serverId),
                });
                if (currentUser && payload.userId === currentUser.id) {
                    void queryClient.invalidateQueries({ queryKey: ['me'] });
                    void queryClient.invalidateQueries({
                        queryKey: SERVERS_QUERY_KEYS.onboarding(
                            payload.serverId,
                        ),
                    });
                }
            },
        ),
    );

    cleanups.push(
        wsClient.on<IMemberAddedEvent>(
            WsEvents.MEMBER_ADDED,
            (payload): void => {
                if (currentUser && payload.userId === currentUser.id) {
                    void queryClient.invalidateQueries({
                        queryKey: SERVERS_QUERY_KEYS.list,
                    });
                }
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.members(payload.serverId),
                });
            },
        ),
    );

    cleanups.push(
        wsClient.on<IRoleEvent>(WsEvents.ROLE_CREATED, (payload): void => {
            if (payload.senderId === currentUser?.id) return;
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.roles(payload.serverId),
            });
        }),
    );

    cleanups.push(
        wsClient.on<IRoleEvent>(WsEvents.ROLE_UPDATED, (payload): void => {
            if (payload.senderId === currentUser?.id) return;
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.roles(payload.serverId),
            });
        }),
    );

    cleanups.push(
        wsClient.on<IRoleDeletedEvent>(
            WsEvents.ROLE_DELETED,
            (payload): void => {
                if (payload.senderId === currentUser?.id) return;
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.roles(payload.serverId),
                });
            },
        ),
    );

    cleanups.push(
        wsClient.on<IRolesReorderedEvent>(
            WsEvents.ROLES_REORDERED,
            (payload): void => {
                if (payload.senderId === currentUser?.id) return;
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.roles(payload.serverId),
                });
            },
        ),
    );

    cleanups.push(
        wsClient.on<IChannelEvent>(
            WsEvents.CHANNEL_CREATED,
            (payload): void => {
                upsertChannel(payload.channel);
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.channels(payload.serverId),
                });
            },
        ),
    );

    cleanups.push(
        wsClient.on<IChannelEvent>(
            WsEvents.CHANNEL_UPDATED,
            (payload): void => {
                if (payload.senderId === currentUser?.id) return;
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.channels(payload.serverId),
                });
            },
        ),
    );

    cleanups.push(
        wsClient.on<IChannelDeletedEvent>(
            WsEvents.CHANNEL_DELETED,
            (payload): void => {
                if (payload.senderId === currentUser?.id) return;
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.channels(payload.serverId),
                });
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.categories(payload.serverId),
                });
            },
        ),
    );

    cleanups.push(
        wsClient.on<IChannelsReorderedEvent>(
            WsEvents.CHANNELS_REORDERED,
            (payload): void => {
                if (payload.senderId === currentUser?.id) return;
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.channels(payload.serverId),
                });
            },
        ),
    );

    cleanups.push(
        wsClient.on<ICategoryEvent>(
            WsEvents.CATEGORY_CREATED,
            (payload): void => {
                if (payload.senderId === currentUser?.id) return;
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.categories(payload.serverId),
                });
            },
        ),
    );

    cleanups.push(
        wsClient.on<ICategoryEvent>(
            WsEvents.CATEGORY_UPDATED,
            (payload): void => {
                if (payload.senderId === currentUser?.id) return;
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.categories(payload.serverId),
                });
            },
        ),
    );

    cleanups.push(
        wsClient.on<ICategoryDeletedEvent>(
            WsEvents.CATEGORY_DELETED,
            (payload): void => {
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
            (payload): void => {
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
            (payload): void => {
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
            (payload): void => {
                if (payload.senderId === currentUser?.id) return;
                void queryClient.invalidateQueries({
                    queryKey: [
                        'servers',
                        'category_permissions',
                        payload.serverId,
                        payload.categoryId,
                    ],
                });
                void queryClient.invalidateQueries({
                    queryKey: [
                        'servers',
                        'category_permissions',
                        payload.serverId,
                    ],
                });
                void queryClient.invalidateQueries({
                    queryKey: [
                        'servers',
                        'channel_permissions',
                        payload.serverId,
                    ],
                });
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
        wsClient.on<IServerJoinedEvent>(
            WsEvents.SERVER_JOINED,
            (payload): void => {
                if (payload.voiceStates) {
                    Object.entries(
                        payload.voiceStates as Record<string, string[]>,
                    ).forEach(([channelId, userIds]): void => {
                        dispatch(setVoiceParticipants({ channelId, userIds }));
                    });
                }
            },
        ),
    );

    cleanups.push(
        wsClient.on<IServerUpdatedEvent>(
            WsEvents.SERVER_UPDATED,
            (payload): void => {
                if (payload.senderId === currentUser?.id) return;
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.details(payload.serverId),
                });
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.list,
                });
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.onboarding(payload.serverId),
                });
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.onboardingSettings(
                        payload.serverId,
                    ),
                });
            },
        ),
    );

    cleanups.push(
        wsClient.on<ICommandsUpdatedEvent>(
            WsEvents.COMMANDS_UPDATED,
            (payload): void => {
                void queryClient.invalidateQueries({
                    queryKey: COMMANDS_QUERY_KEYS.serverCommands(
                        payload.serverId,
                    ),
                });
            },
        ),
    );

    cleanups.push(
        wsClient.on<{ serverId: string; senderId?: string }>(
            WsEvents.SERVER_DELETED,
            (payload): void => {
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
            (payload): void => {
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
            (payload): void => {
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
            (payload): void => {
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.details(payload.serverId),
                });
            },
        ),
    );

    cleanups.push(
        wsClient.on<IMemberRemovedEvent>(
            WsEvents.MEMBER_REMOVED,
            (payload): void => {
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.members(payload.serverId),
                });
                if (currentUser && payload.userId === currentUser.id) {
                    void queryClient.invalidateQueries({
                        queryKey: SERVERS_QUERY_KEYS.list,
                    });
                }
            },
        ),
    );

    // Emoji events
    cleanups.push(
        wsClient.on<IEmojiUpdatedEvent>(
            WsEvents.EMOJI_UPDATED,
            (payload): void => {
                if (payload.senderId === currentUser?.id) return;
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.emojis(payload.serverId),
                });
            },
        ),
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
        }>(WsEvents.MESSAGE_SERVER_EDITED, (payload): void => {
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
                    pages: currentData.pages.map(
                        (page: ChatMessage[]): ChatMessage[] =>
                            page.map(
                                (msg): ChatMessage =>
                                    msg.id === payload.messageId
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
        }>(WsEvents.MESSAGE_DM_EDITED, (payload): void => {
            // Update DM message in cache for both users
            const queryKey1 = CHAT_QUERY_KEYS.userMessages(payload.senderId);
            const queryKey2 = CHAT_QUERY_KEYS.userMessages(payload.receiverId);

            [queryKey1, queryKey2].forEach((queryKey): void => {
                const currentData = queryClient.getQueryData(queryKey) as
                    | InfiniteData<ChatMessage[]>
                    | undefined;
                if (currentData?.pages) {
                    queryClient.setQueryData(queryKey, {
                        ...currentData,
                        pages: currentData.pages.map(
                            (page: ChatMessage[]): ChatMessage[] =>
                                page.map(
                                    (msg): ChatMessage =>
                                        msg.id === payload.messageId
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
        wsClient.on(WsEvents.DISCONNECTED, (): void => {
            // We consciously do not invalidate active queries here to avoid
            // triggering a giant fetch storm while the network might be down.
            // Queries will be automatically invalidated on the AUTHENTICATED event.
        }),
    );

    return (): void => {
        cleanups.forEach((cleanup): void => cleanup());
    };
};

/**
 * @description WS handlers
 */
export const wsHandlers = {
    onMessageDm: (handler: (message: IMessageDm) => void): (() => void) =>
        wsClient.on(WsEvents.MESSAGE_DM, handler),
    onMessageServer: (
        handler: (message: IMessageServer) => void,
    ): (() => void) => wsClient.on(WsEvents.MESSAGE_SERVER, handler),
};
