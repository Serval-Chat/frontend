import React, { Suspense, lazy, useState } from 'react';

import { Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
    useClearChannelPings,
    useDeletePing,
    usePings,
} from '@/api/pings/pings.queries';
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
import { useSlowMode } from '@/hooks/chat/useSlowMode';
import { usePermissions } from '@/hooks/usePermissions';
import { useChatWS } from '@/hooks/ws/useChatWS';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setTargetMessageId } from '@/store/slices/navSlice';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { ChatEmptyState } from '@/ui/components/chat/ChatEmptyState';
import { ChatHeader } from '@/ui/components/chat/ChatHeader';
import { ChatLoadingState } from '@/ui/components/chat/ChatLoadingState';
import { MessagesList } from '@/ui/components/chat/MessagesList';
import { TypingIndicator } from '@/ui/components/chat/TypingIndicator';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { wsMessages } from '@/ws';

import { StickyMessageBar } from './StickyMessageBar';

const MessageInput = lazy(() =>
    import('@/ui/components/chat/MessageInput').then((m) => ({
        default: m.MessageInput,
    })),
);

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
    const [showPins, setShowPins] = useState(false);

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
    const { data: pings } = usePings();
    const { mutate: clearChannelPings } = useClearChannelPings();
    const { mutate: deletePing } = useDeletePing();

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

    const canBypassSlowMode =
        !selectedServerId || hasPermission('bypassSlowmode');
    const { cooldown, setCooldown } = useSlowMode(
        selectedChannel,
        canBypassSlowMode,
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

    // Auto-clear pings when seen in chat
    React.useEffect(() => {
        if (selectedServerId && selectedChannelId) {
            wsMessages.markChannelRead(selectedServerId, selectedChannelId);

            if (pings?.pings) {
                const hasPingsInActiveChannel = pings.pings.some(
                    (p) => p.channelId === selectedChannelId,
                );
                if (hasPingsInActiveChannel) {
                    clearChannelPings(selectedChannelId);
                }
            }
        } else if (selectedFriendId) {
            wsMessages.markDmRead(selectedFriendId);
            if (pings?.pings) {
                const friendPings = pings.pings.filter(
                    (p) => p.senderId === selectedFriendId && !p.serverId,
                );
                if (friendPings.length > 0) {
                    friendPings.forEach((p) => deletePing(p.id));
                }
            }
        }
    }, [
        selectedChannelId,
        selectedServerId,
        selectedFriendId,
        pings?.pings,
        messages?.length,
        clearChannelPings,
        deletePing,
    ]);

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

    const isServerContext = !!selectedServerId && !!selectedChannelId;

    return (
        <Box
            className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <ChatHeader
                friendUser={friendUser}
                selectedChannel={selectedChannel}
                selectedFriendId={selectedFriendId}
                showPins={showPins}
                onTogglePins={() => setShowPins((v) => !v)}
            />

            {isServerContext && (
                <StickyMessageBar
                    channelId={selectedChannelId}
                    serverId={selectedServerId}
                />
            )}

            {isViewingOlderMessages && (
                <Box className="bg-warning/10 border-warning/30 flex items-center justify-between border-b px-6 py-3">
                    <Text className="text-warning" size="sm">
                        You are viewing older messages
                    </Text>
                    <button
                        className="text-warning hover:text-warning/80 flex items-center gap-2 transition-colors"
                        onClick={handleJumpToLatest}
                    >
                        <X size={16} />
                        <span className="text-sm">Jump to latest</span>
                    </button>
                </Box>
            )}

            {selectedChannel?.type === 'voice' ? (
                <Box className="flex flex-1 items-center justify-center bg-[var(--chat-bg)] p-8">
                    <Text className="text-muted-foreground">
                        This is a Voice Channel. Connect to it via the sidebar.
                    </Text>
                </Box>
            ) : (
                <>
                    <Box className="relative flex min-h-0 flex-1 flex-col">
                        {isLoading ? (
                            <ChatLoadingState />
                        ) : (
                            <MessagesList
                                activeHighlightId={targetMessageId}
                                disableColors={
                                    currentUser?.settings
                                        ?.disableCustomUsernameColors
                                }
                                disableCustomFonts={
                                    serverDetails?.disableCustomFonts ||
                                    currentUser?.settings
                                        ?.disableCustomUsernameFonts
                                }
                                disableGlow={
                                    currentUser?.settings
                                        ?.disableCustomUsernameGlow
                                }
                                disableGlowAndColors={
                                    serverDetails?.disableUsernameGlowAndCustomColor
                                }
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
                        <TypingIndicator
                            canBypassSlowMode={canBypassSlowMode}
                            cooldown={cooldown}
                            isSlowModeEnabled={
                                !!selectedChannel?.slowMode &&
                                selectedChannel.slowMode > 0
                            }
                            typingUsers={typingUsers}
                        />
                    </Box>

                    {canSendMessages ? (
                        <Suspense
                            fallback={
                                <Box className="mx-4 mb-4 flex h-[56px] items-center rounded-lg border border-border-subtle bg-[var(--bg-msg-input)] px-4" />
                            }
                        >
                            <MessageInput
                                canBypassSlowMode={canBypassSlowMode}
                                cooldown={cooldown}
                                disableColors={
                                    currentUser?.settings
                                        ?.disableCustomUsernameColors
                                }
                                disableCustomFonts={
                                    serverDetails?.disableCustomFonts ||
                                    currentUser?.settings
                                        ?.disableCustomUsernameFonts
                                }
                                disableGlow={
                                    currentUser?.settings
                                        ?.disableCustomUsernameGlow
                                }
                                disableGlowAndColors={
                                    serverDetails?.disableUsernameGlowAndCustomColor
                                }
                                fileQueueResult={fileQueueResult}
                                replyingTo={replyingTo}
                                setCooldown={setCooldown}
                                onCancelReply={() => setReplyingTo(null)}
                            />
                        </Suspense>
                    ) : (
                        <Box className="mx-4 mb-4 flex h-[56px] items-center rounded-lg border border-border-subtle bg-[var(--bg-msg-input)] px-4">
                            <Text className="text-muted-foreground" size="sm">
                                You can&apos;t type in this channel.
                            </Text>
                        </Box>
                    )}

                    {/* Drag and Drop Overlay */}
                    {isDragging && (
                        <Box className="animate-in fade-in zoom-in pointer-events-none absolute inset-0 z-[var(--z-index-backdrop)] m-4 flex flex-col items-center justify-center rounded-3xl border-4 border-dashed border-primary/50 bg-bg-primary/80 p-8 backdrop-blur-sm transition-all duration-200">
                            <div className="mb-4 rounded-full bg-primary/10 p-6">
                                <Upload className="text-primary" size={48} />
                            </div>
                            <Text size="xl" weight="bold">
                                Drop files to upload
                            </Text>
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};
