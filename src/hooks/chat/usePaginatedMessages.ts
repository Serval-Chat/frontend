import { useChannelMessages, useUserMessages } from '@/api/chat/chat.queries';

/**
 * @description Hook to manage paginated message fetching based on the active context.
 */
export const usePaginatedMessages = (
    selectedFriendId: string | null,
    selectedServerId: string | null,
    selectedChannelId: string | null
) => {
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
