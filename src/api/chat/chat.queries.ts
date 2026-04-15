import {
    type InfiniteData,
    type UseInfiniteQueryResult,
    type UseQueryResult,
    keepPreviousData,
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { chatApi } from './chat.api';
import type { ChatMessage } from './chat.types';

interface EditUserMessageVariables {
    messageId: string;
    content: string;
    userId?: string;
}

export const CHAT_QUERY_KEYS = {
    userMessages: (userId: string | null) =>
        ['chat', 'messages', 'user', userId] as const,
    channelMessages: (
        serverId: string | null,
        channelId: string | null,
        targetMessageId: string | null = null,
    ) =>
        [
            'chat',
            'messages',
            'channel',
            serverId,
            channelId,
            targetMessageId,
        ] as const,
    channelPins: (channelId: string | null) =>
        ['chat', 'pins', channelId] as const,
};

const LIMIT = 50;

/**
 * @description Hook to fetch messages for a specific user
 */
export const useUserMessages = (
    userId: string | null,
): UseInfiniteQueryResult<InfiniteData<ChatMessage[]>, Error> =>
    useInfiniteQuery({
        queryKey: CHAT_QUERY_KEYS.userMessages(userId),
        queryFn: ({ pageParam }) =>
            chatApi.getUserMessages(userId!, LIMIT, pageParam),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => {
            if (lastPage.length < LIMIT) return undefined;
            return lastPage[0]._id;
        },
        enabled: !!userId,
        placeholderData: keepPreviousData,
    });

/**
 * @description Hook to fetch messages for a specific channel
 */
export const useChannelMessages = (
    serverId: string | null,
    channelId: string | null,
    around?: string | null,
): UseInfiniteQueryResult<InfiniteData<ChatMessage[]>, Error> =>
    useInfiniteQuery({
        queryKey: CHAT_QUERY_KEYS.channelMessages(
            serverId,
            channelId,
            around || null,
        ),
        queryFn: ({ pageParam }) => {
            if (around && !pageParam) {
                return chatApi.getChannelMessages(
                    serverId!,
                    channelId!,
                    LIMIT * 2,
                    undefined,
                    around,
                );
            }
            return chatApi.getChannelMessages(
                serverId!,
                channelId!,
                LIMIT,
                pageParam as string | undefined,
            );
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => {
            if (lastPage.length < LIMIT) return undefined;
            return lastPage[0]._id;
        },
        enabled: !!serverId && !!channelId,
        placeholderData: keepPreviousData,
    });

/**
 * @description Hook to delete a message
 */
export const useDeleteMessage = (): {
    mutate: (vars: {
        serverId: string;
        channelId: string;
        messageId: string;
    }) => void;
    isPending: boolean;
} => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: ({
            serverId,
            channelId,
            messageId,
        }: {
            serverId: string;
            channelId: string;
            messageId: string;
        }) => chatApi.deleteMessage(serverId, channelId, messageId),
        onMutate: async (variables) => {
            // cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({
                predicate: (query) =>
                    query.queryKey[0] === 'chat' &&
                    query.queryKey[1] === 'messages' &&
                    query.queryKey[2] === 'channel' &&
                    query.queryKey[3] === variables.serverId &&
                    query.queryKey[4] === variables.channelId,
            });

            // optimistically update to the new value using setQueriesData
            queryClient.setQueriesData<InfiniteData<ChatMessage[]>>(
                {
                    predicate: (query) =>
                        query.queryKey[0] === 'chat' &&
                        query.queryKey[1] === 'messages' &&
                        query.queryKey[2] === 'channel' &&
                        query.queryKey[3] === variables.serverId &&
                        query.queryKey[4] === variables.channelId,
                },
                (oldData) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map((page) =>
                            page.filter(
                                (msg) => msg._id !== variables.messageId,
                            ),
                        ),
                    };
                },
            );

            return {};
        },
        onError: (_err, variables, _context) => {
            void queryClient.invalidateQueries({
                predicate: (query) =>
                    query.queryKey[0] === 'chat' &&
                    query.queryKey[1] === 'messages' &&
                    query.queryKey[2] === 'channel' &&
                    query.queryKey[3] === variables.serverId &&
                    query.queryKey[4] === variables.channelId,
            });
        },
        onSettled: (_data, _error, variables) => {
            // always refetch after error or success
            void queryClient.invalidateQueries({
                predicate: (query) =>
                    query.queryKey[0] === 'chat' &&
                    query.queryKey[1] === 'messages' &&
                    query.queryKey[2] === 'channel' &&
                    query.queryKey[3] === variables.serverId &&
                    query.queryKey[4] === variables.channelId,
            });
        },
    });

    return {
        mutate: mutation.mutate,
        isPending: mutation.isPending,
    };
};

/**
 * @description Hook to edit a channel message
 */
export const useEditChannelMessage = (): {
    mutate: (vars: {
        serverId: string;
        channelId: string;
        messageId: string;
        content: string;
    }) => void;
    isPending: boolean;
} => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: ({
            serverId,
            channelId,
            messageId,
            content,
        }: {
            serverId: string;
            channelId: string;
            messageId: string;
            content: string;
        }) =>
            chatApi.editChannelMessage(serverId, channelId, messageId, content),
        onMutate: async (variables) => {
            // cancel any outgoing refetches
            await queryClient.cancelQueries({
                predicate: (query) =>
                    query.queryKey[0] === 'chat' &&
                    query.queryKey[1] === 'messages' &&
                    query.queryKey[2] === 'channel' &&
                    query.queryKey[3] === variables.serverId &&
                    query.queryKey[4] === variables.channelId,
            });

            // optimistically update the message
            queryClient.setQueriesData<InfiniteData<ChatMessage[]>>(
                {
                    predicate: (query) =>
                        query.queryKey[0] === 'chat' &&
                        query.queryKey[1] === 'messages' &&
                        query.queryKey[2] === 'channel' &&
                        query.queryKey[3] === variables.serverId &&
                        query.queryKey[4] === variables.channelId,
                },
                (oldData) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map((page) =>
                            page.map((msg) =>
                                msg._id === variables.messageId
                                    ? {
                                          ...msg,
                                          text: variables.content,
                                          isEdited: true,
                                          editedAt: new Date().toISOString(),
                                      }
                                    : msg,
                            ),
                        ),
                    };
                },
            );

            return {};
        },
        onError: (_err, variables, _context) => {
            void queryClient.invalidateQueries({
                predicate: (query) =>
                    query.queryKey[0] === 'chat' &&
                    query.queryKey[1] === 'messages' &&
                    query.queryKey[2] === 'channel' &&
                    query.queryKey[3] === variables.serverId &&
                    query.queryKey[4] === variables.channelId,
            });
        },
        onSettled: (_data, _error, variables) => {
            void queryClient.invalidateQueries({
                predicate: (query) =>
                    query.queryKey[0] === 'chat' &&
                    query.queryKey[1] === 'messages' &&
                    query.queryKey[2] === 'channel' &&
                    query.queryKey[3] === variables.serverId &&
                    query.queryKey[4] === variables.channelId,
            });
        },
    });

    return {
        mutate: mutation.mutate,
        isPending: mutation.isPending,
    };
};

/**
 * @description Hook to edit a direct message
 */
export const useEditUserMessage = (): {
    mutate: (vars: {
        messageId: string;
        content: string;
        userId?: string;
    }) => void;
    isPending: boolean;
} => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: ({ messageId, content }: EditUserMessageVariables) =>
            chatApi.editUserMessage(messageId, content),
        onMutate: async (variables) => {
            // For DMs, we need to invalidate both user's message queries
            const userId = variables.userId;
            if (userId) {
                await queryClient.cancelQueries({
                    queryKey: CHAT_QUERY_KEYS.userMessages(userId),
                });
            }

            return { userId };
        },
        onSettled: (_data, _error, variables) => {
            const userId = variables.userId;
            if (userId) {
                void queryClient.invalidateQueries({
                    queryKey: CHAT_QUERY_KEYS.userMessages(userId),
                });
            }
        },
    });

    return {
        mutate: mutation.mutate,
        isPending: mutation.isPending,
    };
};

/**
 * @description Hook to toggle message pin
 */
export const useTogglePin = (): {
    mutate: (vars: {
        serverId: string;
        channelId: string;
        messageId: string;
    }) => void;
    isPending: boolean;
} => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: ({
            serverId,
            channelId,
            messageId,
        }: {
            serverId: string;
            channelId: string;
            messageId: string;
        }) => chatApi.togglePin(serverId, channelId, messageId),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: CHAT_QUERY_KEYS.channelPins(variables.channelId),
            });
        },
    });

    return {
        mutate: mutation.mutate,
        isPending: mutation.isPending,
    };
};

/**
 * @description Hook to toggle message sticky
 */
export const useToggleSticky = (): {
    mutate: (vars: {
        serverId: string;
        channelId: string;
        messageId: string;
    }) => void;
    isPending: boolean;
} => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: ({
            serverId,
            channelId,
            messageId,
        }: {
            serverId: string;
            channelId: string;
            messageId: string;
        }) => chatApi.toggleSticky(serverId, channelId, messageId),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: CHAT_QUERY_KEYS.channelPins(variables.channelId),
            });
        },
    });

    return {
        mutate: mutation.mutate,
        isPending: mutation.isPending,
    };
};

/**
 * @description Hook to fetch pinned messages
 */
export const usePinnedMessages = (
    serverId: string | null,
    channelId: string | null,
): UseQueryResult<ChatMessage[], Error> =>
    useQuery({
        queryKey: [...CHAT_QUERY_KEYS.channelPins(channelId), serverId],
        queryFn: () => chatApi.getPinnedMessages(serverId!, channelId!),
        enabled: !!serverId && !!channelId,
    });
