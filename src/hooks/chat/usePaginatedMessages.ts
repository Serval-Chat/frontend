import React from 'react';

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
        options?: FetchNextPageOptions,
    ) => Promise<
        InfiniteQueryObserverResult<InfiniteData<ChatMessage[], unknown>, Error>
    >;
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
    const isViewingOlderMessages = React.useMemo(() => {
        if (!targetMessageId || !channelMessages.data) return false;

        // Flatten all pages to see the full set of fetched messages
        const allMessages = channelMessages.data.pages.flat();
        const targetIndex = allMessages.findIndex(
            (m) => m._id === targetMessageId,
        );

        if (targetIndex === -1) return true; // Safety fallback

        // Count messages after the target
        const newerMessages = allMessages.filter(
            (m) =>
                new Date(m.createdAt) >
                new Date(allMessages[targetIndex].createdAt),
        );

        // If we found 50 newer messages, it means we probably haven't reached the bottom
        return newerMessages.length >= limit;
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
