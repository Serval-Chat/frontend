import { useCallback, useEffect, useRef } from 'react';

import { consumeInterceptor } from './debugSendInterceptor';

import { type InfiniteData, useQueryClient } from '@tanstack/react-query';

import { useDmChannel } from '@/api/channels/channels.queries';
import { chatApi } from '@/api/chat/chat.api';
import { CHAT_QUERY_KEYS, LIMIT } from '@/api/chat/chat.queries';
import type {
    ChatMessage,
    MessageAttachment,
    MessagePoll,
    MessageReaction,
    OutgoingPoll,
} from '@/api/chat/chat.types';
import { SERVERS_QUERY_KEYS } from '@/api/servers/servers.queries';
import { useTypingIndicators } from '@/api/servers/servers.queries';
import type { Channel } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import type { InteractionValue } from '@/types/interactions';
import {
    type IMessageDm,
    type IMessageServer,
    type IMessageServerSent,
    type IReactionEventPayload,
    WsEvents,
    wsMessages,
} from '@/ws';

import { type TypingUser, useTypingIndicator } from './useTypingIndicator';
import { useWebSocket } from './useWebSocket';

interface ChatWSResult {
    sendMessage: (
        text: string,
        replyToId?: string,
        stickerId?: string,
        poll?: OutgoingPoll,
        attachments?: MessageAttachment[],
        noEmbedsUrls?: string[],
    ) => void;
    sendTyping: () => void;
    typingUsers: TypingUser[];
    retryMessage: (localId: string) => void;
    discardMessage: (localId: string) => void;
}

export function useChatWS(
    selectedFriendId?: string,
    selectedServerId?: string,
    selectedChannelId?: string,
): ChatWSResult {
    const { data: user } = useMe();
    const { data: dmChannel } = useDmChannel(selectedFriendId ?? null);
    const queryClient = useQueryClient();
    const { typingUsers, addTypingUser, hydrateTypingUsers, clearTypingUsers } =
        useTypingIndicator();
    const lastTypingSentRef = useRef<number>(0);
    const prevChannelRef = useRef<string | null>(null);
    const pendingMapRef = useRef<Map<string, {
        timeoutId: ReturnType<typeof setTimeout>;
        text: string;
        replyToId?: string;
        stickerId?: string;
        poll?: OutgoingPoll;
        attachments?: MessageAttachment[];
        noEmbedsUrls?: string[];
    }>>(new Map());

    const convertDmToChatMessage = useCallback(
        (message: IMessageDm): ChatMessage => ({
            id: message.id,
            channelId: message.channelId,
            text: message.text,
            createdAt: message.createdAt,
            senderId: message.senderId,
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
            components: message.components ?? [],
            attachments: message.attachments,
            reactions: message.reactions,
            interaction: null,
            senderIsBot: message.senderIsBot,
        }),
        [],
    );

    const convertServerMessageToChatMessage = useCallback(
        (message: IMessageServer | IMessageServerSent): ChatMessage => ({
            id: message.id,
            text: message.text,
            createdAt: message.createdAt,
            senderId: message.senderId,
            serverId: message.serverId,
            channelId: message.channelId,
            replyToId: message.replyToId,
            stickerId: message.stickerId,
            poll: message.poll,
            isEdited: message.isEdited,
            isPinned: message.isPinned,
            isSticky: message.isSticky,
            isWebhook: message.isWebhook,
            webhookUsername:
                'webhookUsername' in message
                    ? message.webhookUsername
                    : undefined,
            webhookAvatarUrl:
                'webhookAvatarUrl' in message
                    ? message.webhookAvatarUrl
                    : undefined,
            embeds: message.embeds,
            components: message.components ?? [],
            attachments: message.attachments,
            reactions: message.reactions,
            interaction:
                'interaction' in message && message.interaction
                    ? {
                          command: message.interaction.command,
                          options: (message.interaction.options ||
                              []) as unknown as {
                              name: string;
                              value: InteractionValue;
                          }[],
                          user: message.interaction.user,
                      }
                    : null,
            senderIsBot: message.senderIsBot,
        }),
        [],
    );

    const addMessageToCache = useCallback(
        (queryKey: readonly unknown[], newMessage: ChatMessage): void => {
            queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
                queryKey,
                (oldData): InfiniteData<ChatMessage[]> | undefined => {
                    if (!oldData) return oldData;

                    const firstPage = oldData.pages[0] || [];

                    if (
                        firstPage.some(
                            (msg): boolean => msg.id === newMessage.id,
                        )
                    ) {
                        return oldData;
                    }

                    return {
                        ...oldData,
                        pages: [
                            [...firstPage, newMessage],
                            ...oldData.pages.slice(1),
                        ],
                    };
                },
            );
        },
        [queryClient],
    );

    const resolveOptimisticMessage = useCallback(
        (queryKey: readonly unknown[], confirmedMessage: ChatMessage, localId?: string): void => {
            let targetLocalId = localId;

            if (!targetLocalId && pendingMapRef.current.size > 0) {
                for (const [id, entry] of pendingMapRef.current.entries()) {
                    if (entry.text === confirmedMessage.text) {
                        targetLocalId = id;
                        break;
                    }
                }
                if (!targetLocalId) {
                    targetLocalId = pendingMapRef.current.keys().next().value;
                }
            }

            if (targetLocalId) {
                const entry = pendingMapRef.current.get(targetLocalId);
                if (entry) {
                    clearTimeout(entry.timeoutId);
                    pendingMapRef.current.delete(targetLocalId);
                }
            }

            queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
                queryKey,
                (oldData): InfiniteData<ChatMessage[]> | undefined => {
                    if (!oldData) return oldData;

                    let replaced = false;
                    const pages = oldData.pages.map((page): ChatMessage[] =>
                        page.map((msg): ChatMessage => {
                            if (!replaced) {
                                const isMatch = targetLocalId
                                    ? msg._localId === targetLocalId
                                    : !!msg._pending &&
                                      msg.senderId === confirmedMessage.senderId;

                                if (isMatch) {
                                    replaced = true;
                                    if (msg._localId && msg._localId !== targetLocalId) {
                                        const entry = pendingMapRef.current.get(msg._localId);
                                        if (entry) {
                                            clearTimeout(entry.timeoutId);
                                            pendingMapRef.current.delete(msg._localId);
                                        }
                                    }
                                    return confirmedMessage;
                                }
                            }
                            return msg;
                        }),
                    );

                    if (!replaced) {
                        const alreadyIn = pages[0]?.some((m) => m.id === confirmedMessage.id);
                        if (!alreadyIn) {
                            pages[0] = [...(pages[0] ?? []), confirmedMessage];
                        }
                    }

                    return { ...oldData, pages };
                },
            );
        },
        [queryClient],
    );

    const markMessageFailed = useCallback(
        (queryKey: readonly unknown[], localId: string): void => {
            queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
                queryKey,
                (oldData): InfiniteData<ChatMessage[]> | undefined => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map((page): ChatMessage[] =>
                            page.map((msg): ChatMessage =>
                                msg._localId === localId
                                    ? { ...msg, _pending: 'failed' }
                                    : msg,
                            ),
                        ),
                    };
                },
            );
        },
        [queryClient],
    );

    const removeStubFromCache = useCallback(
        (queryKey: readonly unknown[], localId: string): void => {
            queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
                queryKey,
                (oldData): InfiniteData<ChatMessage[]> | undefined => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map((page): ChatMessage[] =>
                            page.filter((msg): boolean => msg._localId !== localId),
                        ),
                    };
                },
            );
        },
        [queryClient],
    );


    const updateReactionInCache = useCallback(
        (payload: IReactionEventPayload, isRemoval: boolean): void => {
            const queryKey = getQueryKey(
                payload,
                selectedServerId,
                selectedChannelId,
                selectedFriendId,
            );
            if (!queryKey) return;

            queryClient.setQueriesData<InfiniteData<ChatMessage[]>>(
                { queryKey },
                (
                    oldData,
                ):
                    | { pages: ChatMessage[][]; pageParams: unknown[] }
                    | undefined => {
                    if (!oldData) return oldData;

                    return {
                        ...oldData,
                        pages: oldData.pages.map((page): ChatMessage[] =>
                            page.map(
                                (msg): ChatMessage =>
                                    msg.id === payload.messageId
                                        ? updateMessageReactions(
                                              msg,
                                              payload,
                                              isRemoval,
                                          )
                                        : msg,
                            ),
                        ),
                    };
                },
            );
        },
        [queryClient, selectedServerId, selectedChannelId, selectedFriendId],
    );

    useWebSocket(
        WsEvents.MESSAGE_DM,
        useCallback(
            (message: IMessageDm): void => {
                if (
                    selectedFriendId &&
                    (message.senderId === selectedFriendId ||
                        message.receiverId === selectedFriendId)
                ) {
                    const confirmed = convertDmToChatMessage(message);
                    const qk = CHAT_QUERY_KEYS.userMessages(selectedFriendId);
                    if (user?.id && message.senderId === user.id && pendingMapRef.current.size > 0) {
                        resolveOptimisticMessage(qk, confirmed);
                    } else {
                        addMessageToCache(qk, confirmed);
                    }
                }
            },
            [
                selectedFriendId,
                user,
                addMessageToCache,
                resolveOptimisticMessage,
                convertDmToChatMessage,
            ],
        ),
    );

    useWebSocket(
        WsEvents.MESSAGE_DM_SENT,
        useCallback(
            (message: IMessageDm): void => {
                if (
                    selectedFriendId &&
                    (message.senderId === selectedFriendId ||
                        message.receiverId === selectedFriendId)
                ) {
                    const qk = CHAT_QUERY_KEYS.userMessages(selectedFriendId);
                    const confirmed = convertDmToChatMessage(message);
                    resolveOptimisticMessage(qk, confirmed);
                }
            },
            [selectedFriendId, resolveOptimisticMessage, convertDmToChatMessage],
        ),
    );

    useWebSocket(
        WsEvents.MESSAGE_SERVER,
        useCallback(
            (message: IMessageServer): void => {
                if (
                    selectedChannelId &&
                    selectedServerId &&
                    message.channelId === selectedChannelId
                ) {
                    const confirmed = convertServerMessageToChatMessage(message);
                    const qk = CHAT_QUERY_KEYS.channelMessages(
                        selectedServerId,
                        selectedChannelId,
                        null,
                    );
                    if (user?.id && message.senderId === user.id && pendingMapRef.current.size > 0) {
                        resolveOptimisticMessage(qk, confirmed);
                    } else {
                        addMessageToCache(qk, confirmed);
                    }
                }
            },
            [
                selectedChannelId,
                selectedServerId,
                user,
                addMessageToCache,
                resolveOptimisticMessage,
                convertServerMessageToChatMessage,
            ],
        ),
    );

    useWebSocket(
        WsEvents.MESSAGE_SERVER_SENT,
        useCallback(
            (message: IMessageServerSent): void => {
                if (
                    selectedChannelId &&
                    selectedServerId &&
                    message.channelId === selectedChannelId
                ) {
                    const qk = CHAT_QUERY_KEYS.channelMessages(
                        selectedServerId,
                        selectedChannelId,
                        null,
                    );
                    const confirmed = convertServerMessageToChatMessage(message);
                    resolveOptimisticMessage(qk, confirmed);

                    queryClient.setQueryData<Channel[]>(
                        SERVERS_QUERY_KEYS.channels(selectedServerId),
                        (oldChannels): Channel[] | undefined => {
                            if (!oldChannels) return oldChannels;
                            return oldChannels.map(
                                (ch): Channel =>
                                    ch.id === selectedChannelId
                                        ? {
                                              ...ch,
                                              slowModeNextMessageAllowedAt:
                                                  message.slowModeNextMessageAllowedAt,
                                          }
                                        : ch,
                            );
                        },
                    );
                }
            },
            [
                selectedChannelId,
                selectedServerId,
                resolveOptimisticMessage,
                convertServerMessageToChatMessage,
                queryClient,
            ],
        ),
    );

    useEffect((): void => {
        if (selectedServerId) {
            wsMessages.joinServer(selectedServerId);
        }
    }, [selectedServerId]);

    useEffect((): void => {
        if (selectedServerId && selectedChannelId) {
            wsMessages.joinChannel(selectedServerId, selectedChannelId);
        }
    }, [selectedServerId, selectedChannelId]);

    useEffect((): void => {
        if (!selectedServerId || !selectedChannelId) {
            prevChannelRef.current = null;
            return;
        }
        if (prevChannelRef.current !== selectedChannelId) {
            prevChannelRef.current = selectedChannelId;

            const existing = queryClient.getQueryData(
                CHAT_QUERY_KEYS.channelMessages(
                    selectedServerId,
                    selectedChannelId,
                ),
            );

            if (!existing) {
                void queryClient.prefetchInfiniteQuery({
                    queryKey: CHAT_QUERY_KEYS.channelMessages(
                        selectedServerId,
                        selectedChannelId,
                    ),
                    queryFn: ({ pageParam }): Promise<ChatMessage[]> =>
                        chatApi.getChannelMessages(
                            selectedServerId,
                            selectedChannelId,
                            LIMIT,
                            pageParam as string | undefined,
                        ),
                    initialPageParam: undefined,
                });
            }
        }
    }, [queryClient, selectedServerId, selectedChannelId]);

    useWebSocket(
        WsEvents.TYPING_DM,
        useCallback(
            (payload: { senderId: string; senderUsername: string }): void => {
                if (
                    selectedFriendId &&
                    payload.senderId === selectedFriendId &&
                    payload.senderId !== user?.id
                ) {
                    addTypingUser(payload.senderId, payload.senderUsername);
                }
            },
            [selectedFriendId, user?.id, addTypingUser],
        ),
    );

    useWebSocket(
        WsEvents.TYPING_SERVER,
        useCallback(
            (payload: {
                channelId: string;
                senderId: string;
                senderUsername: string;
            }): void => {
                if (
                    selectedChannelId &&
                    payload.channelId === selectedChannelId &&
                    payload.senderId !== user?.id
                ) {
                    addTypingUser(payload.senderId, payload.senderUsername);
                }
            },
            [selectedChannelId, user?.id, addTypingUser],
        ),
    );

    useWebSocket(
        WsEvents.MESSAGE_SERVER_DELETED,
        useCallback(
            (payload: {
                messageId: string;
                channelId: string;
                serverId?: string;
                hard?: boolean;
            }): void => {
                queryClient.setQueriesData<InfiniteData<ChatMessage[]>>(
                    {
                        predicate: (query): boolean =>
                            query.queryKey[0] === 'chat' &&
                            query.queryKey[1] === 'messages' &&
                            query.queryKey[2] === 'channel' &&
                            query.queryKey[4] === payload.channelId,
                    },
                    (
                        oldData,
                    ):
                        | { pages: ChatMessage[][]; pageParams: unknown[] }
                        | undefined => {
                        if (!oldData) return oldData;
                        return {
                            ...oldData,
                            pages: oldData.pages.map((page): ChatMessage[] => {
                                if (payload.hard === false) {
                                    return page.map(
                                        (msg): ChatMessage =>
                                            msg.id === payload.messageId
                                                ? {
                                                      ...msg,
                                                      deletedAt:
                                                          new Date().toISOString(),
                                                  }
                                                : msg,
                                    );
                                }
                                return page.filter(
                                    (msg): boolean =>
                                        msg.id !== payload.messageId,
                                );
                            }),
                        };
                    },
                );

                void queryClient.invalidateQueries({
                    queryKey: CHAT_QUERY_KEYS.channelPins(payload.channelId),
                });
            },
            [queryClient],
        ),
    );

    useWebSocket(
        WsEvents.MESSAGES_SERVER_BULK_DELETED,
        useCallback(
            (payload: {
                messageIds: string[];
                channelId: string;
                hard?: boolean;
            }): void => {
                queryClient.setQueriesData<InfiniteData<ChatMessage[]>>(
                    {
                        predicate: (query): boolean =>
                            query.queryKey[0] === 'chat' &&
                            query.queryKey[1] === 'messages' &&
                            query.queryKey[2] === 'channel' &&
                            query.queryKey[4] === payload.channelId,
                    },
                    (
                        oldData,
                    ):
                        | { pages: ChatMessage[][]; pageParams: unknown[] }
                        | undefined => {
                        if (!oldData) return oldData;
                        return {
                            ...oldData,
                            pages: oldData.pages.map((page): ChatMessage[] => {
                                if (payload.hard === false) {
                                    return page.map(
                                        (msg): ChatMessage =>
                                            payload.messageIds.includes(msg.id)
                                                ? {
                                                      ...msg,
                                                      deletedAt:
                                                          new Date().toISOString(),
                                                  }
                                                : msg,
                                    );
                                }
                                return page.filter(
                                    (msg): boolean =>
                                        !payload.messageIds.includes(msg.id),
                                );
                            }),
                        };
                    },
                );

                void queryClient.invalidateQueries({
                    queryKey: CHAT_QUERY_KEYS.channelPins(payload.channelId),
                });
            },
            [queryClient],
        ),
    );

    useWebSocket(
        WsEvents.MESSAGE_SERVER_EDITED,
        useCallback(
            (payload: {
                messageId: string;
                serverId: string;
                channelId: string;
                text: string;
                editedAt: string;
                isEdited: boolean;
                embeds?: ChatMessage['embeds'];
                components?: ChatMessage['components'];
                attachments?: ChatMessage['attachments'];
            }): void => {
                queryClient.setQueriesData<InfiniteData<ChatMessage[]>>(
                    {
                        predicate: (query): boolean =>
                            query.queryKey[0] === 'chat' &&
                            query.queryKey[1] === 'messages' &&
                            query.queryKey[2] === 'channel' &&
                            query.queryKey[3] === payload.serverId &&
                            query.queryKey[4] === payload.channelId,
                    },
                    (
                        oldData,
                    ):
                        | { pages: ChatMessage[][]; pageParams: unknown[] }
                        | undefined => {
                        if (!oldData) return oldData;
                        return {
                            ...oldData,
                            pages: oldData.pages.map((page): ChatMessage[] =>
                                page.map(
                                    (msg): ChatMessage =>
                                        msg.id === payload.messageId
                                            ? {
                                                  ...msg,
                                                  text: payload.text,
                                                  isEdited: payload.isEdited,
                                                  editedAt: payload.editedAt,
                                                  embeds:
                                                      payload.embeds ??
                                                      msg.embeds,
                                                  components:
                                                      payload.components ??
                                                      msg.components,
                                                  attachments:
                                                      payload.attachments ??
                                                      msg.attachments,
                                              }
                                            : msg,
                                ),
                            ),
                        };
                    },
                );
            },
            [queryClient],
        ),
    );

    useWebSocket(
        WsEvents.MESSAGE_DM_EDITED,
        useCallback(
            (payload: {
                messageId: string;
                text: string;
                editedAt: string;
                isEdited: boolean;
                embeds?: ChatMessage['embeds'];
                components?: ChatMessage['components'];
                attachments?: ChatMessage['attachments'];
            }): void => {
                if (!selectedFriendId) return;
                queryClient.setQueriesData<InfiniteData<ChatMessage[]>>(
                    {
                        predicate: (query): boolean =>
                            query.queryKey[0] === 'chat' &&
                            query.queryKey[1] === 'messages' &&
                            query.queryKey[2] === 'user' &&
                            query.queryKey[3] === selectedFriendId,
                    },
                    (
                        oldData,
                    ):
                        | { pages: ChatMessage[][]; pageParams: unknown[] }
                        | undefined => {
                        if (!oldData) return oldData;
                        return {
                            ...oldData,
                            pages: oldData.pages.map((page): ChatMessage[] =>
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
                                                  components:
                                                      payload.components ??
                                                      msg.components,
                                              }
                                            : msg,
                                ),
                            ),
                        };
                    },
                );
            },
            [queryClient, selectedFriendId],
        ),
    );

    useWebSocket(
        WsEvents.MESSAGE_DM_DELETED,
        useCallback(
            (payload: { messageId: string }): void => {
                if (!selectedFriendId) return;
                queryClient.setQueriesData<InfiniteData<ChatMessage[]>>(
                    {
                        predicate: (query): boolean =>
                            query.queryKey[0] === 'chat' &&
                            query.queryKey[1] === 'messages' &&
                            query.queryKey[2] === 'user' &&
                            query.queryKey[3] === selectedFriendId,
                    },
                    (
                        oldData,
                    ):
                        | { pages: ChatMessage[][]; pageParams: unknown[] }
                        | undefined => {
                        if (!oldData) return oldData;
                        return {
                            ...oldData,
                            pages: oldData.pages.map((page): ChatMessage[] =>
                                page.filter(
                                    (msg): boolean =>
                                        msg.id !== payload.messageId,
                                ),
                            ),
                        };
                    },
                );
            },
            [queryClient, selectedFriendId],
        ),
    );

    useWebSocket(
        WsEvents.MESSAGE_SERVER_EMBEDS_UPDATED,
        useCallback(
            (payload: {
                messageId: string;
                serverId: string;
                channelId: string;
                embeds: ChatMessage['embeds'];
            }): void => {
                queryClient.setQueriesData<InfiniteData<ChatMessage[]>>(
                    {
                        predicate: (query): boolean =>
                            query.queryKey[0] === 'chat' &&
                            query.queryKey[1] === 'messages' &&
                            query.queryKey[2] === 'channel' &&
                            query.queryKey[3] === payload.serverId &&
                            query.queryKey[4] === payload.channelId,
                    },
                    (
                        oldData,
                    ):
                        | { pages: ChatMessage[][]; pageParams: unknown[] }
                        | undefined => {
                        if (!oldData) return oldData;
                        return {
                            ...oldData,
                            pages: oldData.pages.map((page): ChatMessage[] =>
                                page.map(
                                    (msg): ChatMessage =>
                                        msg.id === payload.messageId
                                            ? {
                                                  ...msg,
                                                  embeds: payload.embeds,
                                              }
                                            : msg,
                                ),
                            ),
                        };
                    },
                );
            },
            [queryClient],
        ),
    );

    useWebSocket(
        WsEvents.MESSAGE_DM_EMBEDS_UPDATED,
        useCallback(
            (payload: {
                messageId: string;
                embeds: ChatMessage['embeds'];
            }): void => {
                if (!selectedFriendId) return;
                queryClient.setQueriesData<InfiniteData<ChatMessage[]>>(
                    {
                        predicate: (query): boolean =>
                            query.queryKey[0] === 'chat' &&
                            query.queryKey[1] === 'messages' &&
                            query.queryKey[2] === 'user' &&
                            query.queryKey[3] === selectedFriendId,
                    },
                    (
                        oldData,
                    ):
                        | { pages: ChatMessage[][]; pageParams: unknown[] }
                        | undefined => {
                        if (!oldData) return oldData;
                        return {
                            ...oldData,
                            pages: oldData.pages.map((page): ChatMessage[] =>
                                page.map(
                                    (msg): ChatMessage =>
                                        msg.id === payload.messageId
                                            ? {
                                                  ...msg,
                                                  embeds: payload.embeds,
                                              }
                                            : msg,
                                ),
                            ),
                        };
                    },
                );
            },
            [queryClient, selectedFriendId],
        ),
    );

    useWebSocket(
        WsEvents.MESSAGE_SERVER_PIN_UPDATED,
        useCallback(
            (payload: {
                messageId: string;
                serverId: string;
                channelId: string;
                isPinned: boolean;
                isSticky: boolean;
            }): void => {
                queryClient.setQueriesData<InfiniteData<ChatMessage[]>>(
                    {
                        predicate: (query): boolean =>
                            query.queryKey[0] === 'chat' &&
                            query.queryKey[1] === 'messages' &&
                            query.queryKey[2] === 'channel' &&
                            query.queryKey[3] === payload.serverId &&
                            query.queryKey[4] === payload.channelId,
                    },
                    (
                        oldData,
                    ):
                        | { pages: ChatMessage[][]; pageParams: unknown[] }
                        | undefined => {
                        if (!oldData) return oldData;
                        return {
                            ...oldData,
                            pages: oldData.pages.map((page): ChatMessage[] =>
                                page.map(
                                    (msg): ChatMessage =>
                                        msg.id === payload.messageId
                                            ? {
                                                  ...msg,
                                                  isPinned: payload.isPinned,
                                                  isSticky: payload.isSticky,
                                              }
                                            : msg,
                                ),
                            ),
                        };
                    },
                );

                void queryClient.invalidateQueries({
                    queryKey: CHAT_QUERY_KEYS.channelPins(payload.channelId),
                });
            },
            [queryClient],
        ),
    );

    useWebSocket(
        WsEvents.POLL_VOTE_UPDATED_DM,
        useCallback(
            (payload: { messageId: string; poll: MessagePoll }): void => {
                if (selectedFriendId) {
                    queryClient.setQueriesData<InfiniteData<ChatMessage[]>>(
                        {
                            predicate: (query): boolean =>
                                query.queryKey[0] === 'chat' &&
                                query.queryKey[1] === 'messages' &&
                                query.queryKey[2] === 'user' &&
                                query.queryKey[3] === selectedFriendId,
                        },
                        (
                            oldData,
                        ):
                            | { pages: ChatMessage[][]; pageParams: unknown[] }
                            | undefined => {
                            if (!oldData) return oldData;
                            return {
                                ...oldData,
                                pages: oldData.pages.map(
                                    (page): ChatMessage[] =>
                                        page.map(
                                            (msg): ChatMessage =>
                                                msg.id === payload.messageId
                                                    ? {
                                                          ...msg,
                                                          poll: payload.poll,
                                                      }
                                                    : msg,
                                        ),
                                ),
                            };
                        },
                    );
                }
            },
            [queryClient, selectedFriendId],
        ),
    );

    useWebSocket(
        WsEvents.POLL_VOTE_UPDATED_SERVER,
        useCallback(
            (payload: {
                messageId: string;
                serverId: string;
                channelId: string;
                poll: MessagePoll;
            }): void => {
                queryClient.setQueriesData<InfiniteData<ChatMessage[]>>(
                    {
                        predicate: (query): boolean =>
                            query.queryKey[0] === 'chat' &&
                            query.queryKey[1] === 'messages' &&
                            query.queryKey[2] === 'channel' &&
                            query.queryKey[3] === payload.serverId &&
                            query.queryKey[4] === payload.channelId,
                    },
                    (
                        oldData,
                    ):
                        | { pages: ChatMessage[][]; pageParams: unknown[] }
                        | undefined => {
                        if (!oldData) return oldData;
                        return {
                            ...oldData,
                            pages: oldData.pages.map((page): ChatMessage[] =>
                                page.map(
                                    (msg): ChatMessage =>
                                        msg.id === payload.messageId
                                            ? { ...msg, poll: payload.poll }
                                            : msg,
                                ),
                            ),
                        };
                    },
                );
            },
            [queryClient],
        ),
    );

    useWebSocket(
        WsEvents.REACTION_ADDED,
        useCallback(
            (payload: IReactionEventPayload): void => {
                updateReactionInCache(payload, false);
            },
            [updateReactionInCache],
        ),
    );

    useWebSocket(
        WsEvents.REACTION_REMOVED,
        useCallback(
            (payload: IReactionEventPayload): void => {
                updateReactionInCache(payload, true);
            },
            [updateReactionInCache],
        ),
    );

    useWebSocket(
        WsEvents.DM_UNREAD_UPDATED,
        useCallback((): void => {
            void queryClient.invalidateQueries({ queryKey: ['friends'] });
        }, [queryClient]),
    );

    useEffect((): void => {
        clearTypingUsers();
    }, [selectedFriendId, selectedChannelId, clearTypingUsers]);

    const { data: typingSnapshot } = useTypingIndicators(
        selectedServerId ?? null,
        selectedChannelId ?? null,
    );

    useEffect((): void => {
        if (!typingSnapshot || typingSnapshot.length === 0) return;
        hydrateTypingUsers(typingSnapshot, user?.id);
    }, [typingSnapshot, hydrateTypingUsers, user?.id]);

    const sendMessageCore = useCallback(
        (
            _localId: string,
            text: string,
            replyToId?: string,
            stickerId?: string,
            poll?: OutgoingPoll,
            attachments?: MessageAttachment[],
            noEmbedsUrls?: string[],
        ): void => {
            const interceptor = consumeInterceptor();

            const doSend = (): void => {
                if (selectedFriendId) {
                    wsMessages.sendMessageDm(
                        selectedFriendId,
                        text,
                        replyToId,
                        stickerId,
                        poll,
                        attachments,
                        noEmbedsUrls,
                    );
                } else if (selectedServerId && selectedChannelId) {
                    wsMessages.sendMessageServer(
                        selectedServerId,
                        selectedChannelId,
                        text,
                        replyToId,
                        stickerId,
                        poll,
                        attachments,
                        noEmbedsUrls,
                    );
                }
            };

            if (interceptor?.mode === 'drop') {
                return;
            }

            if (interceptor?.mode === 'delay') {
                setTimeout(doSend, interceptor.delayMs);
                return;
            }

            doSend();
        },
        [selectedFriendId, selectedServerId, selectedChannelId],
    );

    const sendMessage = useCallback(
        (
            text: string,
            replyToId?: string,
            stickerId?: string,
            poll?: OutgoingPoll,
            attachments?: MessageAttachment[],
            noEmbedsUrls?: string[],
        ): void => {
            if (!user) return;

            const localId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;

            const stub: ChatMessage = {
                id: localId,
                _localId: localId,
                _pending: 'sending',
                text,
                createdAt: new Date().toISOString(),
                senderId: user.id,
                serverId: selectedServerId,
                channelId: selectedFriendId ? dmChannel?.id : selectedChannelId,
                receiverId: selectedFriendId,
                replyToId,
                stickerId: stickerId ?? null,
                isEdited: false,
                isPinned: false,
                isSticky: false,
                isWebhook: false,
                embeds: [],
                attachments: attachments ?? [],
                reactions: [],
                interaction: null,
                poll: poll ? {
                    title: poll.title,
                    options: poll.options.map((o) => ({ ...o, id: localId, votes: [] })),
                    multiSelect: poll.multiSelect,
                    expiresAt: poll.expiresAt,
                } : null,
                senderIsBot: false,
            };

            const qk = selectedFriendId
                ? CHAT_QUERY_KEYS.userMessages(selectedFriendId)
                : selectedServerId && selectedChannelId
                  ? CHAT_QUERY_KEYS.channelMessages(selectedServerId, selectedChannelId, null)
                  : null;

            if (qk) {
                addMessageToCache(qk, stub);

                const timeoutId = setTimeout((): void => {
                    pendingMapRef.current.delete(localId);
                    markMessageFailed(qk, localId);
                }, 15_000);

                pendingMapRef.current.set(localId, {
                    timeoutId,
                    text,
                    replyToId,
                    stickerId,
                    poll,
                    attachments,
                    noEmbedsUrls,
                });
            }

            sendMessageCore(localId, text, replyToId, stickerId, poll, attachments, noEmbedsUrls);
        },
        [
            user,
            selectedFriendId,
            selectedServerId,
            selectedChannelId,
            dmChannel?.id,
            addMessageToCache,
            markMessageFailed,
            sendMessageCore,
        ],
    );

    const retryMessage = useCallback(
        (localId: string): void => {
            const qk = selectedFriendId
                ? CHAT_QUERY_KEYS.userMessages(selectedFriendId)
                : selectedServerId && selectedChannelId
                  ? CHAT_QUERY_KEYS.channelMessages(selectedServerId, selectedChannelId, null)
                  : null;
            if (!qk) return;

            queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
                qk,
                (oldData): InfiniteData<ChatMessage[]> | undefined => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map((page): ChatMessage[] =>
                            page.map((msg): ChatMessage =>
                                msg._localId === localId
                                    ? { ...msg, _pending: 'sending', createdAt: new Date().toISOString() }
                                    : msg,
                            ),
                        ),
                    };
                },
            );

            let payload = pendingMapRef.current.get(localId);
            if (!payload) {
                const stub = queryClient
                    .getQueryData<InfiniteData<ChatMessage[]>>(qk)
                    ?.pages.flat()
                    .find((m) => m._localId === localId);
                if (!stub) return;
                payload = {
                    timeoutId: undefined as unknown as ReturnType<typeof setTimeout>,
                    text: stub.text,
                    replyToId: stub.replyToId,
                    attachments: stub.attachments,
                };
            } else {
                clearTimeout(payload.timeoutId);
            }

            const timeoutId = setTimeout((): void => {
                pendingMapRef.current.delete(localId);
                markMessageFailed(qk, localId);
            }, 15_000);

            pendingMapRef.current.set(localId, { ...payload, timeoutId });

            sendMessageCore(
                localId,
                payload.text,
                payload.replyToId,
                payload.stickerId,
                payload.poll,
                payload.attachments,
                payload.noEmbedsUrls,
            );
        },
        [
            selectedFriendId,
            selectedServerId,
            selectedChannelId,
            queryClient,
            markMessageFailed,
            sendMessageCore,
        ],
    );

    const discardMessage = useCallback(
        (localId: string): void => {
            const entry = pendingMapRef.current.get(localId);
            if (entry) {
                clearTimeout(entry.timeoutId);
                pendingMapRef.current.delete(localId);
            }
            const qk = selectedFriendId
                ? CHAT_QUERY_KEYS.userMessages(selectedFriendId)
                : selectedServerId && selectedChannelId
                  ? CHAT_QUERY_KEYS.channelMessages(selectedServerId, selectedChannelId, null)
                  : null;
            if (qk) removeStubFromCache(qk, localId);
        },
        [selectedFriendId, selectedServerId, selectedChannelId, removeStubFromCache],
    );

    const sendTyping = useCallback((): void => {
        const now = Date.now();
        if (now - lastTypingSentRef.current < 2000) {
            return;
        }

        if (selectedFriendId) {
            wsMessages.sendTypingDm(selectedFriendId);
            lastTypingSentRef.current = now;
        } else if (selectedServerId && selectedChannelId) {
            wsMessages.sendTypingServer(selectedServerId, selectedChannelId);
            lastTypingSentRef.current = now;
        }
    }, [selectedFriendId, selectedServerId, selectedChannelId]);

    return {
        sendMessage,
        sendTyping,
        typingUsers,
        retryMessage,
        discardMessage,
    };
}

function getQueryKey(
    payload: IReactionEventPayload,
    serverId?: string,
    channelId?: string,
    friendId?: string,
): readonly unknown[] | null {
    if (payload.messageType === 'server' && serverId && channelId) {
        return CHAT_QUERY_KEYS.channelMessages(serverId, channelId);
    }
    return friendId ? CHAT_QUERY_KEYS.userMessages(friendId) : null;
}

function updateMessageReactions(
    msg: ChatMessage,
    payload: IReactionEventPayload,
    isRemoval: boolean,
): ChatMessage {
    const reactions = [...(msg.reactions || [])];
    const existingIdx = reactions.findIndex(
        (r): boolean =>
            r.emoji === payload.emoji && r.emojiType === payload.emojiType,
    );

    return isRemoval
        ? removeReaction(msg, reactions, existingIdx, payload.userId)
        : addReaction(msg, reactions, existingIdx, payload);
}

function removeReaction(
    msg: ChatMessage,
    reactions: MessageReaction[],
    existingIdx: number,
    userId: string,
): ChatMessage {
    if (existingIdx === -1) return msg;

    // existingIdx came from reactions.findIndex(...) and was just checked
    // against -1, so it is a valid index into `reactions`.
    const reaction = reactions[existingIdx]!;
    const userIndex = reaction.users.indexOf(userId);
    if (userIndex === -1) return msg;

    const newUsers = reaction.users.filter((id): boolean => id !== userId);

    if (newUsers.length === 0) {
        reactions.splice(existingIdx, 1);
    } else {
        reactions[existingIdx] = {
            ...reaction,
            users: newUsers,
            count: newUsers.length,
        };
    }

    return { ...msg, reactions };
}

function addReaction(
    msg: ChatMessage,
    reactions: MessageReaction[],
    existingIdx: number,
    payload: IReactionEventPayload,
): ChatMessage {
    if (existingIdx === -1) {
        reactions.push({
            emoji: payload.emoji,
            emojiType: payload.emojiType,
            emojiId: payload.emojiId!,
            count: 1,
            users: [payload.userId],
        });
    } else {
        // existingIdx !== -1 here, and it came from
        // reactions.findIndex(...), so it is a valid index.
        const reaction = reactions[existingIdx]!;
        if (reaction.users.includes(payload.userId)) return msg;

        reactions[existingIdx] = {
            ...reaction,
            users: [...reaction.users, payload.userId],
            count: reaction.count + 1,
        };
    }

    return { ...msg, reactions };
}
