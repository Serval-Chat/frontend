import React from 'react';

import type {
    FetchNextPageOptions,
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
    const userMessages = useUserMessages(selectedFriendId);
    const channelMessages = useChannelMessages(
        selectedServerId,
        selectedChannelId,
        targetMessageId,
    );

    const limit = 50;
    const isViewingOlderMessages = React.useMemo((): boolean => {
        if (!targetMessageId || !channelMessages.data) return false;

        const pages = channelMessages.data.pages;
        let targetMsg: ChatMessage | undefined;

        // Find target message without flattening
        for (const page of pages) {
            targetMsg = page.find((m): boolean => m.id === targetMessageId);
            if (targetMsg) break;
        }

        if (!targetMsg) return true;

        const targetTime = targetMsg.createdAt;
        let newerCount = 0;

        // Count messages newer than target without flattening
        for (const page of pages) {
            for (const msg of page) {
                if (msg.createdAt > targetTime) {
                    newerCount++;
                    if (newerCount >= limit) return true;
                }
            }
        }

        return false;
    }, [targetMessageId, channelMessages.data]);

    if (selectedFriendId) {
        return {
            rawMessagesData: userMessages.data,
            isLoading: userMessages.isLoading,
            fetchNextPage: userMessages.fetchNextPage,
            hasNextPage: userMessages.hasNextPage,
            isFetchingNextPage: userMessages.isFetchingNextPage,
            isViewingOlderMessages: false,
        };
    }

    return {
        rawMessagesData: channelMessages.data,
        isLoading: channelMessages.isLoading,
        fetchNextPage: channelMessages.fetchNextPage,
        hasNextPage: channelMessages.hasNextPage,
        isFetchingNextPage: channelMessages.isFetchingNextPage,
        isViewingOlderMessages,
    };
};
