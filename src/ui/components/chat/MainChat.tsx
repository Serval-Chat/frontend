import React, { useState } from 'react';

import { Upload } from 'lucide-react';

import {
    useChannels,
    useMembers,
    useRoles,
    useServerDetails,
} from '@/api/servers/servers.queries';
import { useMe, useUserById } from '@/api/users/users.queries';
import { useFileQueue } from '@/hooks/chat/useFileQueue';
import { useMemberMaps } from '@/hooks/chat/useMemberMaps';
import { usePaginatedMessages } from '@/hooks/chat/usePaginatedMessages';
import { useProcessedMessages } from '@/hooks/chat/useProcessedMessages';
import { useChatWS } from '@/hooks/ws/useChatWS';
import { useAppSelector } from '@/store/hooks';
import { ChatEmptyState } from '@/ui/components/chat/ChatEmptyState';
import { ChatHeader } from '@/ui/components/chat/ChatHeader';
import { ChatLoadingState } from '@/ui/components/chat/ChatLoadingState';
import { MessageInput } from '@/ui/components/chat/MessageInput';
import { MessagesList } from '@/ui/components/chat/MessagesList';
import { TypingIndicator } from '@/ui/components/chat/TypingIndicator';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';

/**
 * @description Main chat area component that displays messages for the selected conversation.
 */
export const MainChat: React.FC = () => {
    const selectedFriendId = useAppSelector(
        (state) => state.nav.selectedFriendId,
    );
    const selectedServerId = useAppSelector(
        (state) => state.nav.selectedServerId,
    );
    const selectedChannelId = useAppSelector(
        (state) => state.nav.selectedChannelId,
    );

    // File Upload State
    const [isDragging, setIsDragging] = useState(false);
    const fileQueueResult = useFileQueue();

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
        [channels, selectedChannelId],
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
        selectedChannelId,
    );

    const messages = useProcessedMessages(
        rawMessagesData,
        currentUser,
        friendUser,
        selectedFriendId,
        selectedServerId,
        serverMemberMap,
        highestRoleMap,
    );

    const { typingUsers } = useChatWS(
        selectedFriendId ?? undefined,
        selectedServerId ?? undefined,
        selectedChannelId ?? undefined,
    );

    const handleDragOver = (e: React.DragEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            fileQueueResult.addFiles(e.dataTransfer.files);
        }
    };

    if (!selectedFriendId && !selectedChannelId) {
        return (
            <Box>
                <ChatHeader
                    friendUser={undefined}
                    selectedChannel={undefined}
                    selectedFriendId=""
                />
                <ChatEmptyState />
            </Box>
        );
    }

    return (
        <Box
            className="flex-1 flex flex-col min-h-0 relative overflow-hidden"
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <ChatHeader
                friendUser={friendUser}
                selectedChannel={selectedChannel}
                selectedFriendId={selectedFriendId}
            />

            <Box className="flex-1 flex flex-col min-h-0">
                {isLoading ? (
                    <ChatLoadingState />
                ) : (
                    <MessagesList
                        disableCustomFonts={serverDetails?.disableCustomFonts}
                        hasMore={hasNextPage}
                        isLoadingMore={isFetchingNextPage}
                        messages={messages}
                        onLoadMore={() => void fetchNextPage()}
                    />
                )}
            </Box>

            <TypingIndicator typingUsers={typingUsers} />
            <MessageInput fileQueueResult={fileQueueResult} />

            {/* Drag and Drop Overlay */}
            {isDragging && (
                <Box className="absolute inset-0 z-50 bg-bg-primary/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 border-4 border-dashed border-primary/50 m-4 rounded-3xl pointer-events-none transition-all animate-in fade-in zoom-in duration-200">
                    <div className="bg-primary/10 p-6 rounded-full mb-4">
                        <Upload className="text-primary" size={48} />
                    </div>
                    <Text size="xl" weight="bold">
                        Drop files to upload
                    </Text>
                </Box>
            )}
        </Box>
    );
};
