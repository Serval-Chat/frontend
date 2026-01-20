import {
    type InfiniteData,
    type UseInfiniteQueryResult,
    useInfiniteQuery,
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
