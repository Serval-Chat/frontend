import type {
    FetchNextPageOptions,
    FetchPreviousPageOptions,
    InfiniteData,
    InfiniteQueryObserverResult,
} from '@tanstack/react-query';

import { useChannelMessages, useUserMessages } from '@/api/chat/chat.queries';
import type { ChatMessage } from '@/api/chat/chat.types';

interface PaginatedMessagesResult {
    rawMessagesData: InfiniteData<ChatMessage[]> | undefined;
    isLoading: boolean;
    fetchNextPage: (
        options?: FetchNextPageOptions,
    ) => Promise<InfiniteQueryObserverResult<InfiniteData<ChatMessage[]>>>;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNewerMessages: (
        options?: FetchPreviousPageOptions,
    ) => Promise<InfiniteQueryObserverResult<InfiniteData<ChatMessage[]>>>;
    isFetchingNewerMessages: boolean;
    isViewingOlderMessages: boolean;
}

/**
 * @description Hook to manage paginated message fetching based on the active context.
 * When a targetMessageId is present, loads messages around that ID instead of regular pagination.
 */
export const usePaginatedMessages = (
    selectedFriendId: string | null,
    selectedServerId: string | null,
    selectedChannelId: string | null,
    targetMessageId: string | null = null,
): PaginatedMessagesResult => {
    const userMessages = useUserMessages(selectedFriendId, targetMessageId);
    const channelMessages = useChannelMessages(
        selectedServerId,
        selectedChannelId,
        targetMessageId,
    );

    const active = selectedFriendId ? userMessages : channelMessages;
    const isViewingOlderMessages = !!targetMessageId && active.hasPreviousPage;

    return {
        rawMessagesData: active.data,
        isLoading: active.isLoading,
        fetchNextPage: active.fetchNextPage,
        hasNextPage: active.hasNextPage,
        isFetchingNextPage: active.isFetchingNextPage,
        fetchNewerMessages: active.fetchPreviousPage,
        isFetchingNewerMessages: active.isFetchingPreviousPage,
        isViewingOlderMessages,
    };
};
