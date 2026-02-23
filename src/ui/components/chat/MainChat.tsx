import React, { useState } from 'react';

import { Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
import { usePermissions } from '@/hooks/usePermissions';
import { useChatWS } from '@/hooks/ws/useChatWS';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setTargetMessageId } from '@/store/slices/navSlice';
import type { ProcessedChatMessage } from '@/types/chat.ui';
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
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const selectedFriendId = useAppSelector(
        (state) => state.nav.selectedFriendId,
    );
    const selectedServerId = useAppSelector(
        (state) => state.nav.selectedServerId,
    );
    const selectedChannelId = useAppSelector(
        (state) => state.nav.selectedChannelId,
    );
    const targetMessageId = useAppSelector(
        (state) => state.nav.targetMessageId,
    );

    // File Upload State
    const [isDragging, setIsDragging] = useState(false);
    const fileQueueResult = useFileQueue();
    const [replyingTo, setReplyingTo] = useState<ProcessedChatMessage | null>(
        null,
    );

    // Data Fetching
    const { data: currentUser } = useMe();
    const { data: friendUser, isError: isFriendError } = useUserById(
        selectedFriendId ?? '',
        {
            enabled: !!selectedFriendId,
        },
    );
    const { data: serverDetails } = useServerDetails(selectedServerId);
    const { data: channels } = useChannels(selectedServerId);
    const { data: members } = useMembers(selectedServerId);
    const { data: roles } = useRoles(selectedServerId);
    const { hasPermission } = usePermissions(
        selectedServerId,
        selectedChannelId,
    );

    // dms have no permissions therefore always allow.
    const canSendMessages = !selectedServerId || hasPermission('sendMessages');

    const selectedChannel = React.useMemo(
        () => channels?.find((c) => c._id === selectedChannelId),
        [channels, selectedChannelId],
    );

    const { serverMemberMap, highestRoleMap, iconRoleMap } = useMemberMaps(
        members,
        roles,
    );

    const {
        rawMessagesData,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isViewingOlderMessages,
    } = usePaginatedMessages(
        selectedFriendId,
        selectedServerId,
        selectedChannelId,
        targetMessageId,
    );

    const messages = useProcessedMessages(
        rawMessagesData,
        currentUser,
        friendUser,
        selectedFriendId,
        selectedServerId,
        serverMemberMap,
        highestRoleMap,
        iconRoleMap,
    );

    const { typingUsers } = useChatWS(
        selectedFriendId ?? undefined,
        selectedServerId ?? undefined,
        selectedChannelId ?? undefined,
    );

    const handleDragOver = (e: React.DragEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        if (canSendMessages) setIsDragging(true);
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

        if (
            canSendMessages &&
            e.dataTransfer.files &&
            e.dataTransfer.files.length > 0
        ) {
            fileQueueResult.addFiles(e.dataTransfer.files);
        }
    };

    const handleJumpToLatest = (): void => {
        dispatch(setTargetMessageId(null));
        if (selectedServerId && selectedChannelId) {
            void navigate(
                `/chat/@server/${selectedServerId}/channel/${selectedChannelId}`,
            );
        } else if (selectedFriendId) {
            void navigate(`/chat/@user/${selectedFriendId}`);
        }
    };

    React.useEffect(() => {
        if (isFriendError && selectedFriendId) {
            void navigate('/chat/@me', { replace: true });
        }
    }, [isFriendError, selectedFriendId, navigate]);

    const handleReplyClick = (messageId: string): void => {
        if (selectedServerId && selectedChannelId) {
            void navigate(
                `/chat/@server/${selectedServerId}/channel/${selectedChannelId}/message/${messageId}`,
            );
        } else if (selectedFriendId) {
            void navigate(
                `/chat/@user/${selectedFriendId}/message/${messageId}`,
            );
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

            {isViewingOlderMessages && (
                <Box className="bg-warning/10 border-b border-warning/30 px-6 py-3 flex items-center justify-between">
                    <Text className="text-warning" size="sm">
                        You are viewing older messages
                    </Text>
                    <button
                        className="flex items-center gap-2 text-warning hover:text-warning/80 transition-colors"
                        onClick={handleJumpToLatest}
                    >
                        <X size={16} />
                        <span className="text-sm">Jump to latest</span>
                    </button>
                </Box>
            )}

            <Box className="flex-1 flex flex-col min-h-0">
                {isLoading ? (
                    <ChatLoadingState />
                ) : (
                    <MessagesList
                        activeHighlightId={targetMessageId}
                        disableCustomFonts={serverDetails?.disableCustomFonts}
                        disableGlow={serverDetails?.disableCustomFonts}
                        hasMore={hasNextPage}
                        hasMoreNewer={isViewingOlderMessages}
                        isLoadingMore={isFetchingNextPage}
                        messages={messages}
                        onLoadMore={() => void fetchNextPage()}
                        onLoadMoreNewer={handleJumpToLatest}
                        onReplyClick={handleReplyClick}
                        onReplyToMessage={(msg) => setReplyingTo(msg)}
                    />
                )}
            </Box>

            <TypingIndicator typingUsers={typingUsers} />
            {canSendMessages ? (
                <MessageInput
                    disableCustomFonts={serverDetails?.disableCustomFonts}
                    disableGlow={serverDetails?.disableCustomFonts}
                    fileQueueResult={fileQueueResult}
                    replyingTo={replyingTo}
                    onCancelReply={() => setReplyingTo(null)}
                />
            ) : (
                <Box className="mx-4 mb-4 px-4 h-[56px] flex items-center rounded-lg bg-[var(--bg-msg-input)] border border-border-subtle">
                    <Text className="text-muted-foreground" size="sm">
                        You can&apos;t type in this channel.
                    </Text>
                </Box>
            )}

            {/* Drag and Drop Overlay */}
            {isDragging && (
                <Box className="absolute inset-0 z-[var(--z-index-backdrop)] bg-bg-primary/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 border-4 border-dashed border-primary/50 m-4 rounded-3xl pointer-events-none transition-all animate-in fade-in zoom-in duration-200">
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
