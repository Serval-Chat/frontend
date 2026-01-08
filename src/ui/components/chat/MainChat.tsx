import React from 'react';

import {
    useChannels,
    useMembers,
    useRoles,
    useServerDetails,
} from '@/api/servers/servers.queries';
import { useMe, useUserById } from '@/api/users/users.queries';
import { useMemberMaps } from '@/hooks/chat/useMemberMaps';
import { usePaginatedMessages } from '@/hooks/chat/usePaginatedMessages';
import { useProcessedMessages } from '@/hooks/chat/useProcessedMessages';
import { useAppSelector } from '@/store/hooks';
import { ChatEmptyState } from '@/ui/components/chat/ChatEmptyState';
import { ChatHeader } from '@/ui/components/chat/ChatHeader';
import { ChatLoadingState } from '@/ui/components/chat/ChatLoadingState';
import { MessagesList } from '@/ui/components/chat/MessagesList';

/**
 * @description Main chat area component that displays messages for the selected conversation.
 */
export const MainChat: React.FC = () => {
    const selectedFriendId = useAppSelector(
        (state) => state.nav.selectedFriendId
    );
    const selectedServerId = useAppSelector(
        (state) => state.nav.selectedServerId
    );
    const selectedChannelId = useAppSelector(
        (state) => state.nav.selectedChannelId
    );

    // Data Fetching
    const { data: currentUser } = useMe();
    const { data: friendUser } = useUserById(selectedFriendId ?? '', {
        enabled: !!selectedFriendId,
    });
    const { data: serverDetails } = useServerDetails(selectedServerId);
    const { data: channels } = useChannels(selectedServerId);
    const { data: members } = useMembers(selectedServerId);
    const { data: roles } = useRoles(selectedServerId);

    const selectedChannel = React.useMemo(
        () => channels?.find((c) => c._id === selectedChannelId),
        [channels, selectedChannelId]
    );

    const { serverMemberMap, highestRoleMap } = useMemberMaps(members, roles);

    const {
        rawMessagesData,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = usePaginatedMessages(
        selectedFriendId,
        selectedServerId,
        selectedChannelId
    );

    const messages = useProcessedMessages(
        rawMessagesData,
        currentUser,
        friendUser,
        selectedFriendId,
        selectedServerId,
        serverMemberMap,
        highestRoleMap
    );

    if (!selectedFriendId && !selectedChannelId) {
        return <ChatEmptyState />;
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
            <ChatHeader
                selectedFriendId={selectedFriendId}
                friendUser={friendUser}
                selectedChannel={selectedChannel}
            />

            <div className="flex-1 flex flex-col min-h-0 bg-background/50">
                {isLoading ? (
                    <ChatLoadingState />
                ) : (
                    <MessagesList
                        messages={messages}
                        onLoadMore={fetchNextPage}
                        hasMore={hasNextPage}
                        isLoadingMore={isFetchingNextPage}
                        disableCustomFonts={serverDetails?.disableCustomFonts}
                    />
                )}
            </div>
        </div>
    );
};
