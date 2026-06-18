import {
    type InfiniteData,
    type UseInfiniteQueryResult,
    type UseQueryResult,
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { chatApi } from './chat.api';
import type {
    ChatMessage,
    MessageSearchResponse,
    SearchFilters,
} from './chat.types';

interface EditUserMessageVariables {
    messageId: string;
    content: string;
    userId?: string;
}

export const CHAT_QUERY_KEYS = {
    userMessages: (
        userId: string | null,
    ): readonly ['chat', 'messages', 'user', string | null] =>
        ['chat', 'messages', 'user', userId] as const,
    channelMessages: (
        serverId: string | null,
        channelId: string | null,
        targetMessageId: string | null = null,
    ): readonly [
        'chat',
        'messages',
        'channel',
        string | null,
        string | null,
        string | null,
    ] =>
        [
            'chat',
            'messages',
            'channel',
            serverId,
            channelId,
            targetMessageId,
        ] as const,
    channelPins: (
        channelId: string | null,
    ): readonly ['chat', 'pins', string | null] =>
        ['chat', 'pins', channelId] as const,
    messageSearch: (
        mode: 'dm' | 'channel',
        otherUserId: string | null,
        serverId: string | null,
        channelId: string | null,
        query: string,
        page: number,
        filtersKey: string,
    ): readonly [
        'chat',
        'search',
        string,
        string | null,
        string | null,
        string | null,
        string,
        number,
        string,
    ] =>
        [
            'chat',
            'search',
            mode,
            otherUserId,
            serverId,
            channelId,
            query,
            page,
            filtersKey,
        ] as const,
};

export const LIMIT = 50;

/**
 * @description Hook to fetch messages for a specific user
 */
export const useUserMessages = (
    userId: string | null,
): UseInfiniteQueryResult<InfiniteData<ChatMessage[]>, Error> =>
    useInfiniteQuery({
        queryKey: CHAT_QUERY_KEYS.userMessages(userId),
        queryFn: ({ pageParam }): Promise<ChatMessage[]> =>
            chatApi.getUserMessages(userId!, LIMIT, pageParam),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage): string | undefined => {
            if (lastPage.length < LIMIT) return undefined;
            return lastPage[0].id;
        },
        enabled: !!userId,
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
        queryFn: ({ pageParam }): Promise<ChatMessage[]> => {
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
        getNextPageParam: (lastPage): string | undefined => {
            if (lastPage.length < LIMIT) return undefined;
            return lastPage[0].id;
        },
        enabled: !!serverId && !!channelId,
        staleTime: Infinity,
        gcTime: 30 * 60 * 1000,
    });

/**
 * @description Hook to delete a message
 */
export const useDeleteMessage = (): {
    mutate: (vars: {
        serverId?: string;
        channelId?: string;
        messageId: string;
        userId?: string;
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
            serverId?: string;
            channelId?: string;
            messageId: string;
            userId?: string;
        }): Promise<void> =>
            serverId && channelId
                ? chatApi.deleteMessage(serverId, channelId, messageId)
                : chatApi.deleteUserMessage(messageId),
        onMutate: async (variables): Promise<void> => {
            if (variables.serverId && variables.channelId) {
                // cancel any outgoing refetches (so they don't overwrite our optimistic update)
                await queryClient.cancelQueries({
                    predicate: (query): boolean =>
                        query.queryKey[0] === 'chat' &&
                        query.queryKey[1] === 'messages' &&
                        query.queryKey[2] === 'channel' &&
                        query.queryKey[3] === variables.serverId &&
                        query.queryKey[4] === variables.channelId,
                });

                // optimistically update to the new value using setQueriesData
                queryClient.setQueriesData<InfiniteData<ChatMessage[]>>(
                    {
                        predicate: (query): boolean =>
                            query.queryKey[0] === 'chat' &&
                            query.queryKey[1] === 'messages' &&
                            query.queryKey[2] === 'channel' &&
                            query.queryKey[3] === variables.serverId &&
                            query.queryKey[4] === variables.channelId,
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
                                        msg.id === variables.messageId
                                            ? {
                                                  ...msg,
                                                  deletedAt:
                                                      new Date().toISOString(),
                                              }
                                            : msg,
                                ),
                            ),
                        };
                    },
                );
            } else if (variables.userId) {
                await queryClient.cancelQueries({
                    queryKey: CHAT_QUERY_KEYS.userMessages(variables.userId),
                });

                queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
                    CHAT_QUERY_KEYS.userMessages(variables.userId),
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
                                        msg.id === variables.messageId
                                            ? {
                                                  ...msg,
                                                  deletedAt:
                                                      new Date().toISOString(),
                                              }
                                            : msg,
                                ),
                            ),
                        };
                    },
                );
            }
        },
        onError: (_err, variables, _context): void => {
            if (variables.serverId && variables.channelId) {
                void queryClient.invalidateQueries({
                    predicate: (query): boolean =>
                        query.queryKey[0] === 'chat' &&
                        query.queryKey[1] === 'messages' &&
                        query.queryKey[2] === 'channel' &&
                        query.queryKey[3] === variables.serverId &&
                        query.queryKey[4] === variables.channelId,
                });
            } else if (variables.userId) {
                void queryClient.invalidateQueries({
                    queryKey: CHAT_QUERY_KEYS.userMessages(variables.userId),
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
        }): Promise<ChatMessage> =>
            chatApi.editChannelMessage(serverId, channelId, messageId, content),
        onMutate: async (variables): Promise<void> => {
            // cancel any outgoing refetches
            await queryClient.cancelQueries({
                predicate: (query): boolean =>
                    query.queryKey[0] === 'chat' &&
                    query.queryKey[1] === 'messages' &&
                    query.queryKey[2] === 'channel' &&
                    query.queryKey[3] === variables.serverId &&
                    query.queryKey[4] === variables.channelId,
            });

            // optimistically update the message
            queryClient.setQueriesData<InfiniteData<ChatMessage[]>>(
                {
                    predicate: (query): boolean =>
                        query.queryKey[0] === 'chat' &&
                        query.queryKey[1] === 'messages' &&
                        query.queryKey[2] === 'channel' &&
                        query.queryKey[3] === variables.serverId &&
                        query.queryKey[4] === variables.channelId,
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
                                    msg.id === variables.messageId
                                        ? {
                                              ...msg,
                                              text: variables.content,
                                              isEdited: true,
                                              editedAt:
                                                  new Date().toISOString(),
                                          }
                                        : msg,
                            ),
                        ),
                    };
                },
            );
        },
        onError: (_err, variables, _context): void => {
            void queryClient.invalidateQueries({
                predicate: (query): boolean =>
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
        mutationFn: ({
            messageId,
            content,
        }: EditUserMessageVariables): Promise<ChatMessage> =>
            chatApi.editUserMessage(messageId, content),
        onMutate: async (
            variables,
        ): Promise<{ userId: string | undefined }> => {
            // For DMs, we need to invalidate both user's message queries
            const userId = variables.userId;
            if (userId) {
                await queryClient.cancelQueries({
                    queryKey: CHAT_QUERY_KEYS.userMessages(userId),
                });
            }

            return { userId };
        },
        onSettled: (_data, _error, variables): void => {
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
        }): Promise<ChatMessage> =>
            chatApi.togglePin(serverId, channelId, messageId),
        onSuccess: (_data, variables): void => {
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
        }): Promise<ChatMessage> =>
            chatApi.toggleSticky(serverId, channelId, messageId),
        onSuccess: (_data, variables): void => {
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

const SEARCH_PAGE_SIZE = 25;

function filtersToKey(f: SearchFilters): string {
    const entries = Object.entries(f).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return '';
    return JSON.stringify(
        Object.fromEntries(entries.sort(([a], [b]) => a.localeCompare(b))),
    );
}

function hasActiveFilters(f: SearchFilters): boolean {
    return Object.values(f).some((v) => v !== undefined);
}

/**
 * @description Hook to search messages in a DM or channel conversation
 */
export const useMessageSearch = ({
    mode,
    otherUserId,
    serverId,
    channelId,
    query,
    page = 0,
    filters = {},
}: {
    mode: 'dm' | 'channel';
    otherUserId?: string;
    serverId?: string;
    channelId?: string;
    query: string;
    page?: number;
    filters?: SearchFilters;
}): UseQueryResult<MessageSearchResponse, Error> =>
    useQuery({
        queryKey: CHAT_QUERY_KEYS.messageSearch(
            mode,
            otherUserId ?? null,
            serverId ?? null,
            channelId ?? null,
            query,
            page,
            filtersToKey(filters),
        ),
        queryFn: (): Promise<MessageSearchResponse> =>
            mode === 'dm'
                ? chatApi.searchDmMessages(
                      otherUserId!,
                      query,
                      SEARCH_PAGE_SIZE,
                      page * SEARCH_PAGE_SIZE,
                      filters,
                  )
                : chatApi.searchChannelMessages(
                      serverId!,
                      channelId!,
                      query,
                      SEARCH_PAGE_SIZE,
                      page * SEARCH_PAGE_SIZE,
                      filters,
                  ),
        enabled:
            (query.length >= 1 || hasActiveFilters(filters)) &&
            (mode === 'dm' ? !!otherUserId : !!serverId && !!channelId),
        staleTime: 30_000,
    });

/**
 * @description Hook to fetch pinned messages
 */
export const usePinnedMessages = (
    serverId: string | null,
    channelId: string | null,
): UseQueryResult<ChatMessage[], Error> =>
    useQuery({
        queryKey: [...CHAT_QUERY_KEYS.channelPins(channelId), serverId],
        queryFn: (): Promise<ChatMessage[]> =>
            chatApi.getPinnedMessages(serverId!, channelId!),
        enabled: !!serverId && !!channelId,
    });
