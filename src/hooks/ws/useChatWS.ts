import { useCallback, useEffect, useRef } from 'react';

import { type InfiniteData, useQueryClient } from '@tanstack/react-query';

import { chatApi } from '@/api/chat/chat.api';
import { CHAT_QUERY_KEYS, PREFETCH_LIMIT } from '@/api/chat/chat.queries';
import type {
    ChatMessage,
    MessageAttachment,
    MessagePoll,
    MessageReaction,
    OutgoingPoll,
} from '@/api/chat/chat.types';
import { SERVERS_QUERY_KEYS } from '@/api/servers/servers.queries';
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
}

export function useChatWS(
    selectedFriendId?: string,
    selectedServerId?: string,
    selectedChannelId?: string,
): ChatWSResult {
    const { data: user } = useMe();
    const queryClient = useQueryClient();
    const { typingUsers, addTypingUser, clearTypingUsers } =
        useTypingIndicator();
    const lastTypingSentRef = useRef<number>(0);
    const prevChannelRef = useRef<string | null>(null);

    const convertDmToChatMessage = useCallback(
        (message: IMessageDm): ChatMessage => ({
            _id: message._id,
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
            _id: message._id,
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
                (oldData): InfiniteData<ChatMessage[], unknown> | undefined => {
                    if (!oldData) return oldData;

                    const firstPage = oldData.pages[0] || [];

                    if (
                        firstPage.some(
                            (msg): boolean => msg._id === newMessage._id,
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
                                    msg._id === payload.messageId
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
                    addMessageToCache(
                        CHAT_QUERY_KEYS.userMessages(selectedFriendId),
                        convertDmToChatMessage(message),
                    );
                }
            },
            [selectedFriendId, addMessageToCache, convertDmToChatMessage],
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
                    addMessageToCache(
                        CHAT_QUERY_KEYS.userMessages(selectedFriendId),
                        convertDmToChatMessage(message),
                    );
                }
            },
            [selectedFriendId, addMessageToCache, convertDmToChatMessage],
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
                    addMessageToCache(
                        CHAT_QUERY_KEYS.channelMessages(
                            selectedServerId,
                            selectedChannelId,
                            null, // explicit targetMessageId === null for live view
                        ),
                        convertServerMessageToChatMessage(message),
                    );
                }
            },
            [
                selectedChannelId,
                selectedServerId,
                addMessageToCache,
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
                    addMessageToCache(
                        CHAT_QUERY_KEYS.channelMessages(
                            selectedServerId,
                            selectedChannelId,
                            null, // explicit targetMessageId === null for live view
                        ),
                        convertServerMessageToChatMessage(message),
                    );

                    queryClient.setQueryData<Channel[]>(
                        SERVERS_QUERY_KEYS.channels(selectedServerId),
                        (oldChannels): Channel[] | undefined => {
                            if (!oldChannels) return oldChannels;
                            return oldChannels.map(
                                (ch): Channel =>
                                    ch._id === selectedChannelId
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
                addMessageToCache,
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
                            PREFETCH_LIMIT,
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
                    payload.senderId !== user?._id
                ) {
                    addTypingUser(payload.senderId, payload.senderUsername);
                }
            },
            [selectedFriendId, user?._id, addTypingUser],
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
                    payload.senderId !== user?._id
                ) {
                    addTypingUser(payload.senderId, payload.senderUsername);
                }
            },
            [selectedChannelId, user?._id, addTypingUser],
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
                                            msg._id === payload.messageId
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
                                        msg._id !== payload.messageId,
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
                                            payload.messageIds.includes(msg._id)
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
                                        !payload.messageIds.includes(msg._id),
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
                                        msg._id === payload.messageId
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
                                        msg._id === payload.messageId
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
                                        msg._id !== payload.messageId,
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
                                        msg._id === payload.messageId
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
                                        msg._id === payload.messageId
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
                                        msg._id === payload.messageId
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
                                                msg._id === payload.messageId
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
                                        msg._id === payload.messageId
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

    const sendMessage = useCallback(
        (
            text: string,
            replyToId?: string,
            stickerId?: string,
            poll?: OutgoingPoll,
            attachments?: MessageAttachment[],
            noEmbedsUrls?: string[],
        ): void => {
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
        },
        [selectedFriendId, selectedServerId, selectedChannelId],
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

    if (isRemoval) {
        return removeReaction(msg, reactions, existingIdx, payload.userId);
    } else {
        return addReaction(msg, reactions, existingIdx, payload);
    }
}

function removeReaction(
    msg: ChatMessage,
    reactions: MessageReaction[],
    existingIdx: number,
    userId: string,
): ChatMessage {
    if (existingIdx === -1) return msg;

    const reaction = reactions[existingIdx];
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
    if (existingIdx !== -1) {
        const reaction = reactions[existingIdx];
        if (reaction.users.includes(payload.userId)) return msg;

        reactions[existingIdx] = {
            ...reaction,
            users: [...reaction.users, payload.userId],
            count: reaction.count + 1,
        };
    } else {
        reactions.push({
            emoji: payload.emoji,
            emojiType: payload.emojiType as 'unicode' | 'custom',
            emojiId: payload.emojiId as string,
            count: 1,
            users: [payload.userId],
        });
    }

    return { ...msg, reactions };
}
