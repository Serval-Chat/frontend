import {
    type FetchNextPageOptions,
    type InfiniteData,
    type InfiniteQueryObserverResult,
} from '@tanstack/react-query';

import { useChannelMessages, useUserMessages } from '@/api/chat/chat.queries';
import type { ChatMessage } from '@/api/chat/chat.types';

interface PaginatedMessagesResult {
    rawMessagesData: InfiniteData<ChatMessage[], unknown> | undefined;
    isLoading: boolean;
    fetchNextPage: (
        options?: FetchNextPageOptions
    ) => Promise<
        InfiniteQueryObserverResult<InfiniteData<ChatMessage[], unknown>, Error>
    >;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
}

/**
 * @description Hook to manage paginated message fetching based on the active context.
 */
export const usePaginatedMessages = (
    selectedFriendId: string | null,
    selectedServerId: string | null,
    selectedChannelId: string | null
): PaginatedMessagesResult => {
    const userMessages = useUserMessages(selectedFriendId);
    const channelMessages = useChannelMessages(
        selectedServerId,
        selectedChannelId
    );

    if (selectedFriendId) {
        return {
            rawMessagesData: userMessages.data,
            isLoading: userMessages.isLoading,
            fetchNextPage: userMessages.fetchNextPage,
            hasNextPage: userMessages.hasNextPage,
            isFetchingNextPage: userMessages.isFetchingNextPage,
        };
    }

    return {
        rawMessagesData: channelMessages.data,
        isLoading: channelMessages.isLoading,
        fetchNextPage: channelMessages.fetchNextPage,
        hasNextPage: channelMessages.hasNextPage,
        isFetchingNextPage: channelMessages.isFetchingNextPage,
    };
};
