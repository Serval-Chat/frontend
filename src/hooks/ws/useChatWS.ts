import { useCallback, useEffect, useRef } from 'react';

import { type InfiniteData, useQueryClient } from '@tanstack/react-query';

import { CHAT_QUERY_KEYS } from '@/api/chat/chat.queries';
import { type ChatMessage } from '@/api/chat/chat.types';
import { useMe } from '@/api/users/users.queries';
import {
    type IMessageDm,
    type IMessageServer,
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
    selectedChannelId?: string
): ChatWSResult {
    const { data: user } = useMe();
    const queryClient = useQueryClient();
    const { typingUsers, addTypingUser, clearTypingUsers } =
        useTypingIndicator();
    const lastTypingSentRef = useRef<number>(0);

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
        []
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
        []
    );

    // Helper to add message to cache
    const addMessageToCache = useCallback(
        (queryKey: readonly unknown[], newMessage: ChatMessage) => {
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
                }
            );
        },
        [queryClient]
    );

    // Handle incoming DMs
    useWebSocket(
        WsEvents.MESSAGE_DM,
        useCallback(
            (message: IMessageDm) => {
                if (
                    selectedFriendId &&
                    (message.senderId === selectedFriendId ||
                        message.receiverId === selectedFriendId)
                ) {
                    addMessageToCache(
                        CHAT_QUERY_KEYS.userMessages(selectedFriendId),
                        convertDmToChatMessage(message)
                    );
                }
            },
            [selectedFriendId, addMessageToCache, convertDmToChatMessage]
        )
    );

    // Handle DM sent acknowledgment
    useWebSocket(
        WsEvents.MESSAGE_DM_SENT,
        useCallback(
            (message: IMessageDm) => {
                if (
                    selectedFriendId &&
                    (message.senderId === selectedFriendId ||
                        message.receiverId === selectedFriendId)
                ) {
                    addMessageToCache(
                        CHAT_QUERY_KEYS.userMessages(selectedFriendId),
                        convertDmToChatMessage(message)
                    );
                }
            },
            [selectedFriendId, addMessageToCache, convertDmToChatMessage]
        )
    );

    // Handle incoming server messages
    useWebSocket(
        WsEvents.MESSAGE_SERVER,
        useCallback(
            (message: IMessageServer) => {
                if (
                    selectedChannelId &&
                    selectedServerId &&
                    message.channelId === selectedChannelId
                ) {
                    addMessageToCache(
                        CHAT_QUERY_KEYS.channelMessages(
                            selectedServerId,
                            selectedChannelId
                        ),
                        convertServerMessageToChatMessage(message)
                    );
                }
            },
            [
                selectedChannelId,
                selectedServerId,
                addMessageToCache,
                convertServerMessageToChatMessage,
            ]
        )
    );

    // Handle server message sent acknowledgment
    useWebSocket(
        WsEvents.MESSAGE_SERVER_SENT,
        useCallback(
            (message: IMessageServer) => {
                if (
                    selectedChannelId &&
                    selectedServerId &&
                    message.channelId === selectedChannelId
                ) {
                    addMessageToCache(
                        CHAT_QUERY_KEYS.channelMessages(
                            selectedServerId,
                            selectedChannelId
                        ),
                        convertServerMessageToChatMessage(message)
                    );
                }
            },
            [
                selectedChannelId,
                selectedServerId,
                addMessageToCache,
                convertServerMessageToChatMessage,
            ]
        )
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

    // Handle typing indicators for DMs
    useWebSocket(
        WsEvents.TYPING_DM,
        useCallback(
            (payload: { senderId: string; senderUsername: string }) => {
                if (
                    selectedFriendId &&
                    payload.senderId === selectedFriendId &&
                    payload.senderId !== user?._id
                ) {
                    addTypingUser(payload.senderId, payload.senderUsername);
                }
            },
            [selectedFriendId, user?._id, addTypingUser]
        )
    );

    // Handle typing indicators for server messages
    useWebSocket(
        WsEvents.TYPING_SERVER,
        useCallback(
            (payload: {
                channelId: string;
                senderId: string;
                senderUsername: string;
            }) => {
                if (
                    selectedChannelId &&
                    payload.channelId === selectedChannelId &&
                    payload.senderId !== user?._id
                ) {
                    addTypingUser(payload.senderId, payload.senderUsername);
                }
            },
            [selectedChannelId, user?._id, addTypingUser]
        )
    );

    // Clear typing users when conversation changes
    useEffect(() => {
        clearTypingUsers();
    }, [selectedFriendId, selectedChannelId, clearTypingUsers]);

    const sendMessage = useCallback(
        (text: string, replyToId?: string) => {
            if (selectedFriendId) {
                wsMessages.sendMessageDm(selectedFriendId, text, replyToId);
            } else if (selectedServerId && selectedChannelId) {
                wsMessages.sendMessageServer(
                    selectedServerId,
                    selectedChannelId,
                    text,
                    replyToId
                );
            }
        },
        [selectedFriendId, selectedServerId, selectedChannelId]
    );

    const sendTyping = useCallback(() => {
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
