import {
    type InfiniteData,
    type UseInfiniteQueryResult,
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

import { chatApi } from './chat.api';
import type { ChatMessage } from './chat.types';

export const CHAT_QUERY_KEYS = {
    userMessages: (userId: string | null) =>
        ['chat', 'messages', 'user', userId] as const,
    channelMessages: (serverId: string | null, channelId: string | null) =>
        ['chat', 'messages', 'channel', serverId, channelId] as const,
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
            // The first message in the array is the oldest (since backend returns ASC)
            return lastPage[0]._id;
        },
        enabled: !!userId,
    });

/**
 * @description Hook to fetch messages for a specific channel
 */
export const useChannelMessages = (
    serverId: string | null,
    channelId: string | null,
): UseInfiniteQueryResult<InfiniteData<ChatMessage[]>, Error> =>
    useInfiniteQuery({
        queryKey: CHAT_QUERY_KEYS.channelMessages(serverId, channelId),
        queryFn: ({ pageParam }) =>
            chatApi.getChannelMessages(serverId!, channelId!, LIMIT, pageParam),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => {
            if (lastPage.length < LIMIT) return undefined;
            // The first message in the array is the oldest (since backend returns ASC)
            return lastPage[0]._id;
        },
        enabled: !!serverId && !!channelId,
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
                queryKey: CHAT_QUERY_KEYS.channelMessages(
                    variables.serverId,
                    variables.channelId,
                ),
            });

            // snapshot the previous value
            const previousMessages = queryClient.getQueryData<
                InfiniteData<ChatMessage[]>
            >(
                CHAT_QUERY_KEYS.channelMessages(
                    variables.serverId,
                    variables.channelId,
                ),
            );

            // optimistically update to the new value
            if (previousMessages) {
                queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
                    CHAT_QUERY_KEYS.channelMessages(
                        variables.serverId,
                        variables.channelId,
                    ),
                    {
                        ...previousMessages,
                        pages: previousMessages.pages.map((page) =>
                            page.filter(
                                (msg) => msg._id !== variables.messageId,
                            ),
                        ),
                    },
                );
            }

            // return a context object with the snapshotted value
            return { previousMessages };
        },
        onError: (_err, variables, context) => {
            // if the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousMessages) {
                queryClient.setQueryData(
                    CHAT_QUERY_KEYS.channelMessages(
                        variables.serverId,
                        variables.channelId,
                    ),
                    context.previousMessages,
                );
            }
        },
        onSettled: (_data, _error, variables) => {
            // always refetch after error or success to keep things in sync
            void queryClient.invalidateQueries({
                queryKey: CHAT_QUERY_KEYS.channelMessages(
                    variables.serverId,
                    variables.channelId,
                ),
            });
        },
    });

    return {
        mutate: mutation.mutate,
        isPending: mutation.isPending,
    };
};
