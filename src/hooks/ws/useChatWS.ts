import { useCallback, useEffect, useRef } from 'react';

import { type InfiniteData, useQueryClient } from '@tanstack/react-query';

import { CHAT_QUERY_KEYS } from '@/api/chat/chat.queries';
import { type ChatMessage, type MessageReaction } from '@/api/chat/chat.types';
import { useMe } from '@/api/users/users.queries';
import {
    type IMessageDm,
    type IMessageServer,
    type IReactionEventPayload,
    WsEvents,
    wsMessages,
} from '@/ws';

import { type TypingUser, useTypingIndicator } from './useTypingIndicator';
import { useWebSocket } from './useWebSocket';

interface ChatWSResult {
    sendMessage: (text: string, replyToId?: string) => void;
    sendTyping: () => void;
    typingUsers: TypingUser[];
}

/**
 * @description Hook for WebSockets stuff
 */
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
            _id: message.messageId,
            text: message.text,
            createdAt: message.createdAt,
            senderId: message.senderId,
            receiverId: message.receiverId,
            replyToId: message.replyToId,
            isEdited: message.isEdited,
        }),
        [],
    );

    const convertServerMessageToChatMessage = useCallback(
        (message: IMessageServer): ChatMessage => ({
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
        }),
        [],
    );

    // Helper to add message to cache
    const addMessageToCache = useCallback(
        (queryKey: readonly unknown[], newMessage: ChatMessage): void => {
            queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
                queryKey,
                (oldData) => {
                    if (!oldData) return oldData;

                    const firstPage = oldData.pages[0] || [];

                    // Check if message already exists
                    if (firstPage.some((msg) => msg._id === newMessage._id)) {
                        return oldData;
                    }

                    // Add to the end of the first page (newest messages)
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

    // Helper to update reaction in cache
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
                (oldData) => {
                    if (!oldData) return oldData;

                    return {
                        ...oldData,
                        pages: oldData.pages.map((page) =>
                            page.map((msg) =>
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

    // Handle incoming DMs
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

    // Handle DM sent acknowledgment
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

    // Handle incoming server messages
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

    // Handle server message sent acknowledgment
    useWebSocket(
        WsEvents.MESSAGE_SERVER_SENT,
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

    // Auto-join server when selectedServerId changes
    useEffect(() => {
        if (selectedServerId) {
            wsMessages.joinServer(selectedServerId);
        }
    }, [selectedServerId]);

    // Auto-join channel when selectedChannelId changes
    useEffect(() => {
        if (selectedServerId && selectedChannelId) {
            wsMessages.joinChannel(selectedServerId, selectedChannelId);
        }
    }, [selectedServerId, selectedChannelId]);

    // Refetch channel messages when switching to a channel so we always see fresh data
    useEffect(() => {
        if (!selectedServerId || !selectedChannelId) {
            prevChannelRef.current = null;
            return;
        }
        if (prevChannelRef.current !== selectedChannelId) {
            prevChannelRef.current = selectedChannelId;
            void queryClient.invalidateQueries({
                queryKey: CHAT_QUERY_KEYS.channelMessages(
                    selectedServerId,
                    selectedChannelId,
                ),
            });
        }
    }, [queryClient, selectedServerId, selectedChannelId]);

    // Handle typing indicators for DMs
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

    // Handle typing indicators for server messages
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

    // Handle server message deleted – update cache for that channel regardless of selection
    useWebSocket(
        WsEvents.MESSAGE_SERVER_DELETED,
        useCallback(
            (payload: { messageId: string; channelId: string }): void => {
                queryClient.setQueriesData<InfiniteData<ChatMessage[]>>(
                    {
                        predicate: (query) =>
                            query.queryKey[0] === 'chat' &&
                            query.queryKey[1] === 'messages' &&
                            query.queryKey[2] === 'channel' &&
                            query.queryKey[4] === payload.channelId,
                    },
                    (oldData) => {
                        if (!oldData) return oldData;
                        return {
                            ...oldData,
                            pages: oldData.pages.map((page) =>
                                page.filter(
                                    (msg) => msg._id !== payload.messageId,
                                ),
                            ),
                        };
                    },
                );
            },
            [queryClient],
        ),
    );

    // Handle server message edited – update cache for that channel regardless of selection
    useWebSocket(
        WsEvents.MESSAGE_SERVER_EDITED,
        useCallback(
            (payload: {
                messageId: string;
                serverId: string;
                channelId: string;
                text: string;
                editedAt: string;
                isEdited: true;
            }): void => {
                const queryKey = CHAT_QUERY_KEYS.channelMessages(
                    payload.serverId,
                    payload.channelId,
                );
                queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
                    queryKey,
                    (oldData) => {
                        if (!oldData) return oldData;
                        return {
                            ...oldData,
                            pages: oldData.pages.map((page) =>
                                page.map((msg) =>
                                    msg._id === payload.messageId
                                        ? {
                                              ...msg,
                                              text: payload.text,
                                              isEdited: payload.isEdited,
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

    // Handle reaction added
    useWebSocket(
        WsEvents.REACTION_ADDED,
        useCallback(
            (payload: IReactionEventPayload): void => {
                updateReactionInCache(payload, false);
            },
            [updateReactionInCache],
        ),
    );

    // Handle reaction removed
    useWebSocket(
        WsEvents.REACTION_REMOVED,
        useCallback(
            (payload: IReactionEventPayload): void => {
                updateReactionInCache(payload, true);
            },
            [updateReactionInCache],
        ),
    );

    // Handle DM unread updates
    useWebSocket(
        WsEvents.DM_UNREAD_UPDATED,
        useCallback((): void => {
            void queryClient.invalidateQueries({ queryKey: ['friends'] });
        }, [queryClient]),
    );

    // Clear typing users when conversation changes
    useEffect(() => {
        clearTypingUsers();
    }, [selectedFriendId, selectedChannelId, clearTypingUsers]);

    const sendMessage = useCallback(
        (text: string, replyToId?: string): void => {
            if (selectedFriendId) {
                wsMessages.sendMessageDm(selectedFriendId, text, replyToId);
            } else if (selectedServerId && selectedChannelId) {
                wsMessages.sendMessageServer(
                    selectedServerId,
                    selectedChannelId,
                    text,
                    replyToId,
                );
            }
        },
        [selectedFriendId, selectedServerId, selectedChannelId],
    );

    const sendTyping = useCallback((): void => {
        const now = Date.now();
        // Throttle to once every 2 seconds
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

// Extract helper functions
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
        (r) => r.emoji === payload.emoji && r.emojiType === payload.emojiType,
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

    const newUsers = reaction.users.filter((id) => id !== userId);

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
