import React, { useCallback, useReducer, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, m } from 'framer-motion';
import { ChevronDown, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type { Channel } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { ChatEmptyState } from '@/features/chat/ChatEmptyState';
import {
    CHAT_SEARCH_SIDEBAR_WIDTH,
    ChatHeader,
} from '@/features/chat/ChatHeader';
import { MessageInput } from '@/features/chat/MessageInput';
import { MessageSearchPanel } from '@/features/chat/MessageSearchPanel';
import {
    MessagesList,
    type MessagesListHandle,
} from '@/features/chat/MessagesList';
import { TypingIndicator } from '@/features/chat/TypingIndicator';
import { useChatConversationActions } from '@/hooks/chat/useChatConversationActions';
import { useChatDebugKeybinds } from '@/hooks/chat/useChatDebugKeybinds';
import { useChatNavigationKeybinds } from '@/hooks/chat/useChatNavigationKeybinds';
import { useFileQueue } from '@/hooks/chat/useFileQueue';
import { useMainChatData } from '@/hooks/chat/useMainChatData';
import { useServalBackground } from '@/hooks/chat/useServalBackground';
import { useKeybindManager } from '@/keybinds/useKeybindManager';
import { useTheme } from '@/providers/ThemeProvider';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { Box } from '@/ui/primitives/Box';
import { Button } from '@/ui/primitives/Button';
import { Text } from '@/ui/primitives/Text';
import { colors } from '@/ui/theme';
import { mergeReducer } from '@/utils/mergeReducer';

import { StickyMessageBar } from './StickyMessageBar';

interface MainChatProps {
    requireUrlMatch?: boolean;
    headerActions?: React.ReactNode;
    onToggleMemberList?: () => void;
    isMemberListOpen?: boolean;
    hideMemberListButton?: boolean;
}

interface MainChatUiState {
    isDragging: boolean;
    replyingTo: ProcessedChatMessage | null;
    showPins: boolean;
    isSearchOpen: boolean;
    syncedConversationKey: string;
    debugTypingCount: number;
    isAtBottom: boolean;
}

type ChatData = ReturnType<typeof useMainChatData>;

const dragHasFiles = (dataTransfer: DataTransfer): boolean =>
    Array.from(dataTransfer.types).includes('Files');

interface UsernameStyle {
    disableColors?: boolean;
    disableCustomFonts?: boolean;
    disableGlow?: boolean;
    disableGlowAndColors?: boolean;
}

interface ChatMainColumnProps {
    hasVisibleStickyMessage: boolean;
    isServerContext: boolean;
    selectedServerId: string | null;
    selectedChannelId: string | null;
    selectedFriendId: string | null;
    isViewingOlderMessages: boolean;
    selectedChannel: Channel | undefined;
    messageChannelData: ChatData['messageChannelData'];
    friendUser: User | undefined;
    chatContainerRef: React.RefObject<HTMLElement | null>;
    messagesListRef: React.RefObject<MessagesListHandle | null>;
    targetMessageId: string | null;
    me: React.ComponentProps<typeof MessagesList>['me'];
    serverDetails: ChatData['serverDetails'];
    usernameStyle: UsernameStyle;
    memberMaps: ChatData['memberMaps'];
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    isFetchingNewerMessages: boolean;
    isLoading: boolean;
    messagePermissions: ChatData['messagePermissions'];
    quickReactions: ChatData['quickReactions'];
    isOwner: boolean;
    messages: ChatData['messages'];
    isAtBottom: boolean;
    canBypassSlowMode: boolean;
    cooldown: number;
    setCooldown: ChatData['setCooldown'];
    resolvedTypingUsers: { username: string; userId: string }[];
    canSendMessages: boolean;
    fileQueueResult: React.ComponentProps<
        typeof MessageInput
    >['fileQueueResult'];
    replyingTo: ProcessedChatMessage | null;
    sendMessage: ChatData['sendMessage'];
    sendTyping: ChatData['sendTyping'];
    retryMessage: ChatData['retryMessage'];
    discardMessage: ChatData['discardMessage'];
    isDragging: boolean;
    onAtBottomChange: (isAtBottom: boolean) => void;
    onJumpToLatest: () => void;
    onLoadMore: () => void;
    onLoadNewer: () => void;
    onReplyClick: (messageId: string) => void;
    onReplyToMessage: (msg: ProcessedChatMessage) => void;
    onCancelReply: () => void;
    onStickyVisibilityChange: (isVisible: boolean) => void;
}

const ChatMainColumn = ({
    hasVisibleStickyMessage,
    isServerContext,
    selectedServerId,
    selectedChannelId,
    selectedFriendId,
    isViewingOlderMessages,
    selectedChannel,
    messageChannelData,
    friendUser,
    chatContainerRef,
    messagesListRef,
    targetMessageId,
    me,
    serverDetails,
    usernameStyle,
    memberMaps,
    hasNextPage,
    isFetchingNextPage,
    isFetchingNewerMessages,
    isLoading,
    messagePermissions,
    quickReactions,
    isOwner,
    messages,
    isAtBottom,
    canBypassSlowMode,
    cooldown,
    setCooldown,
    resolvedTypingUsers,
    canSendMessages,
    fileQueueResult,
    replyingTo,
    sendMessage,
    sendTyping,
    retryMessage,
    discardMessage,
    isDragging,
    onAtBottomChange,
    onJumpToLatest,
    onLoadMore,
    onLoadNewer,
    onReplyClick,
    onReplyToMessage,
    onCancelReply,
    onStickyVisibilityChange,
}: ChatMainColumnProps): React.ReactNode => (
    <div className="relative flex min-h-0 flex-1 flex-col">
        {isServerContext && selectedChannelId && selectedServerId ? (
            <div
                className={
                    hasVisibleStickyMessage
                        ? 'relative z-20'
                        : 'relative z-[60]'
                }
            >
                <StickyMessageBar
                    channelId={selectedChannelId}
                    serverId={selectedServerId}
                    onVisibilityChange={onStickyVisibilityChange}
                />
            </div>
        ) : null}

        {isViewingOlderMessages ? (
            <Box className="border-warning/30 relative z-10 flex items-center justify-between border-b bg-background px-6 py-3">
                <Text className="text-warning" size="sm">
                    You are viewing older messages
                </Text>
                <button
                    className="text-warning hover:text-warning/80 flex items-center gap-2 transition-colors"
                    type="button"
                    onClick={onJumpToLatest}
                >
                    <X size={16} />
                    <span className="text-sm">Jump to latest</span>
                </button>
            </Box>
        ) : null}

        {selectedChannel?.type === 'voice' ? (
            <Box
                className="chat-background flex flex-1 items-center justify-center p-8"
                ref={chatContainerRef}
            >
                <Text className="text-muted-foreground">
                    This is a Voice Channel. Connect to it via the sidebar.
                </Text>
            </Box>
        ) : (
            <>
                <Box
                    className="relative z-0 flex min-h-0 flex-1 flex-col"
                    ref={chatContainerRef}
                    style={{ marginTop: 'var(--chat-header-overlap, 0px)' }}
                >
                    <MessagesList
                        activeHighlightId={targetMessageId}
                        disableColors={usernameStyle.disableColors}
                        disableCustomFonts={usernameStyle.disableCustomFonts}
                        disableGlow={usernameStyle.disableGlow}
                        disableGlowAndColors={
                            usernameStyle.disableGlowAndColors
                        }
                        discardMessage={discardMessage}
                        friendUser={friendUser}
                        fullMemberMap={memberMaps.fullMemberMap}
                        hasMore={hasNextPage}
                        hasMoreNewer={isViewingOlderMessages}
                        isLoading={isLoading}
                        isLoadingMore={isFetchingNextPage}
                        isLoadingMoreNewer={isFetchingNewerMessages}
                        isOwner={isOwner}
                        key={selectedChannelId || selectedFriendId}
                        me={me}
                        messageChannelData={messageChannelData}
                        messagePermissions={messagePermissions}
                        messages={messages}
                        quickReactions={quickReactions}
                        ref={messagesListRef}
                        retryMessage={retryMessage}
                        roleMap={memberMaps.roleMap}
                        selectedChannel={selectedChannel}
                        serverDetails={serverDetails}
                        onAtBottomChange={onAtBottomChange}
                        onLoadMore={onLoadMore}
                        onLoadMoreNewer={onLoadNewer}
                        onReplyClick={onReplyClick}
                        onReplyToMessage={onReplyToMessage}
                    />
                    {isAtBottom ? null : (
                        <Button
                            square
                            aria-label="Scroll to bottom"
                            icon={ChevronDown}
                            size="md"
                            style={{
                                position: 'absolute',
                                right: '1rem',
                                bottom: '1rem',
                                borderRadius: '50%',
                                zIndex: 'var(--z-index-content)',
                            }}
                            variant="normal"
                            onClick={(): void =>
                                targetMessageId
                                    ? onJumpToLatest()
                                    : messagesListRef.current?.scrollToBottom()
                            }
                        >
                            {null}
                        </Button>
                    )}
                    <TypingIndicator
                        canBypassSlowMode={canBypassSlowMode}
                        cooldown={cooldown}
                        isSlowModeEnabled={
                            selectedChannel?.slowMode
                                ? selectedChannel.slowMode > 0
                                : undefined
                        }
                        typingUsers={resolvedTypingUsers}
                    />
                </Box>

                {canSendMessages ? (
                    <MessageInput
                        canBypassSlowMode={canBypassSlowMode}
                        cooldown={cooldown}
                        disableColors={usernameStyle.disableColors}
                        disableCustomFonts={usernameStyle.disableCustomFonts}
                        disableGlow={usernameStyle.disableGlow}
                        disableGlowAndColors={
                            usernameStyle.disableGlowAndColors
                        }
                        fileQueueResult={fileQueueResult}
                        replyingTo={replyingTo}
                        sendMessage={sendMessage}
                        sendTyping={sendTyping}
                        setCooldown={setCooldown}
                        onCancelReply={onCancelReply}
                    />
                ) : (
                    <Box className="pride-glass-input mx-4 mb-4 flex h-[56px] items-center rounded-lg border border-border-subtle bg-[var(--bg-msg-input)] px-4">
                        <Text className="text-muted-foreground" size="sm">
                            You can&apos;t type in this channel.
                        </Text>
                    </Box>
                )}

                {isDragging ? (
                    <Box className="animate-in fade-in zoom-in pointer-events-none absolute inset-0 z-[var(--z-index-backdrop)] m-4 flex flex-col items-center justify-center rounded-3xl border-4 border-dashed border-primary/50 bg-bg-primary/80 p-8 backdrop-blur-sm transition duration-200">
                        <div className="mb-4 rounded-full bg-primary/10 p-6">
                            <Upload className="text-primary" size={48} />
                        </div>
                        <Text size="xl" weight="bold">
                            Drop files to upload
                        </Text>
                    </Box>
                ) : null}
            </>
        )}
    </div>
);

interface ChatSearchSidebarProps {
    isOpen: boolean;
    channelId: string | null;
    serverId: string | null;
    friendId: string | null;
    onClose: () => void;
    onNavigateToMessage: (
        messageId: string,
        location?: { serverId?: string; channelId?: string },
    ) => void;
}

const ChatSearchSidebar = ({
    isOpen,
    channelId,
    serverId,
    friendId,
    onClose,
    onNavigateToMessage,
}: ChatSearchSidebarProps): React.ReactNode => (
    <AnimatePresence>
        {isOpen ? (
            <m.aside
                animate={{ width: CHAT_SEARCH_SIDEBAR_WIDTH }}
                exit={{ width: 0 }}
                initial={{ width: 0 }}
                key="search-sidebar"
                style={{
                    overflow: 'hidden',
                    flexShrink: 0,
                    borderLeft: `1px solid ${colors.borderSubtle}`,
                    display: 'flex',
                    flexDirection: 'column',
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
            >
                <div
                    style={{
                        width: CHAT_SEARCH_SIDEBAR_WIDTH,
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        height: '100%',
                    }}
                >
                    <MessageSearchPanel
                        channelId={channelId ?? undefined}
                        mode={friendId ? 'dm' : 'channel'}
                        otherUserId={friendId ?? undefined}
                        serverId={serverId ?? undefined}
                        onClose={onClose}
                        onNavigateToMessage={onNavigateToMessage}
                    />
                </div>
            </m.aside>
        ) : null}
    </AnimatePresence>
);

export const MainChat = ({
    requireUrlMatch = true,
    headerActions,
    onToggleMemberList,
    isMemberListOpen,
    hideMemberListButton,
}: MainChatProps) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const selectedFriendId = useAppSelector(
        (state): string | null => state.nav.selectedFriendId,
    );
    const selectedServerId = useAppSelector(
        (state): string | null => state.nav.selectedServerId,
    );
    const selectedChannelId = useAppSelector(
        (state): string | null => state.nav.selectedChannelId,
    );
    const targetMessageId = useAppSelector(
        (state): string | null => state.nav.targetMessageId,
    );

    const [ui, patchUi] = useReducer(mergeReducer<MainChatUiState>, {
        isDragging: false,
        replyingTo: null,
        showPins: false,
        isSearchOpen: false,
        syncedConversationKey: `${selectedFriendId ?? ''}:${selectedChannelId ?? ''}`,
        debugTypingCount: 0,
        isAtBottom: true,
    });
    const {
        isDragging,
        replyingTo,
        showPins,
        isSearchOpen,
        syncedConversationKey,
        debugTypingCount,
        isAtBottom,
    } = ui;

    const fileQueueResult = useFileQueue();
    const { theme, setTheme } = useTheme();
    const chatContainerRef = useRef<HTMLElement>(null);
    const chatLayoutRef = useRef<HTMLElement>(null);
    const messagesListRef = useRef<MessagesListHandle>(null);
    const [hasVisibleStickyMessage, setHasVisibleStickyMessage] =
        useState(false);
    const handleStickyVisibilityChange = useCallback(
        (isVisible: boolean): void => {
            setHasVisibleStickyMessage((current): boolean =>
                current === isVisible ? current : isVisible,
            );
        },
        [],
    );
    const handleChatHeaderHeightChange = useCallback(
        (height: number, lowerEdge: number): void => {
            chatLayoutRef.current?.style.setProperty(
                '--chat-header-height',
                `${height}px`,
            );
            chatLayoutRef.current?.style.setProperty(
                '--chat-header-overlap',
                `${-height}px`,
            );
            chatLayoutRef.current?.style.setProperty(
                '--chat-header-hidden-tab-offset',
                `${Math.max(0, height - lowerEdge)}px`,
            );
        },
        [],
    );

    useServalBackground(chatContainerRef, theme);

    const { data: currentUser } = useMe();
    const queryClient = useQueryClient();
    const keybindManager = useKeybindManager(currentUser?.settings?.keybinds);

    useChatDebugKeybinds({
        currentUser,
        keybindManager,
        queryClient,
        setTheme,
        theme,
        onAdjustTypingCount: (delta): void => {
            patchUi((s) => ({
                debugTypingCount: (s.debugTypingCount + delta + 5) % 5,
            }));
        },
    });

    const handleEscapeJumpToBottom = useCallback((): void => {
        messagesListRef.current?.scrollToBottom();
    }, []);

    useChatNavigationKeybinds({
        keybindManager,
        onJumpToBottom: handleEscapeJumpToBottom,
    });

    const {
        friendUser,
        isFriendError,
        serverDetails,
        messagePermissions,
        quickReactions,
        isOwner,
        pings,
        clearChannelPings,
        deletePing,
        canSendMessages,
        selectedChannel,
        messageChannelData,
        memberMaps,
        messages,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        fetchNewerMessages,
        isFetchingNewerMessages,
        isViewingOlderMessages,
        retryMessage,
        discardMessage,
        sendMessage,
        sendTyping,
        typingUsers,
        canBypassSlowMode,
        cooldown,
        setCooldown,
    } = useMainChatData({
        requireUrlMatch,
        selectedFriendId,
        selectedServerId,
        selectedChannelId,
        targetMessageId,
        currentUser,
    });

    const typingUsersWithDebug = React.useMemo(
        () => [
            ...typingUsers,
            ...Array.from(
                { length: debugTypingCount },
                (_, i): { userId: string; username: string } => ({
                    userId: `__debug_${i}__`,
                    username: `TestUser${i > 0 ? i + 1 : ''}`,
                }),
            ),
        ],
        [typingUsers, debugTypingCount],
    );

    const resolvedTypingUsers = React.useMemo(
        (): { username: string; userId: string }[] =>
            typingUsersWithDebug.map(
                (u): { username: string; userId: string } => {
                    const member = memberMaps.fullMemberMap.get(u.userId);
                    const resolvedName =
                        member?.nickname ||
                        member?.user?.displayName ||
                        u.username;
                    return { ...u, username: resolvedName };
                },
            ),
        [typingUsersWithDebug, memberMaps.fullMemberMap],
    );

    const { handleJumpToLatest, handleNavigateToMessage, handleReplyClick } =
        useChatConversationActions({
            dispatch,
            navigate,
            selectedFriendId,
            selectedServerId,
            selectedChannelId,
            isFriendError,
            pings,
            clearChannelPings,
            deletePing,
            messages,
        });

    const handleJumpToLatestSmooth = useCallback((): void => {
        if (messagesListRef.current) {
            messagesListRef.current.scrollToBottom(handleJumpToLatest);
        } else {
            handleJumpToLatest();
        }
    }, [handleJumpToLatest]);

    const handleDragOver = (e: React.DragEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        if (canSendMessages && dragHasFiles(e.dataTransfer)) {
            patchUi({ isDragging: true });
        }
    };

    const handleDragLeave = (e: React.DragEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        patchUi({ isDragging: false });
    };

    const handleDrop = (e: React.DragEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        patchUi({ isDragging: false });

        if (
            canSendMessages &&
            e.dataTransfer.files &&
            e.dataTransfer.files.length > 0
        ) {
            fileQueueResult.addFiles(e.dataTransfer.files);
        }
    };

    // close search whenever the active conversation changes
    const conversationKey = `${selectedFriendId ?? ''}:${selectedChannelId ?? ''}`;
    if (conversationKey !== syncedConversationKey) {
        patchUi({
            syncedConversationKey: conversationKey,
            isSearchOpen: false,
        });
    }

    const handleReplyToMessage = useCallback(
        (msg: ProcessedChatMessage): void => {
            patchUi({ replyingTo: msg });
        },
        [],
    );

    const handleLoadMore = useCallback((): void => {
        void fetchNextPage();
    }, [fetchNextPage]);

    const handleLoadNewer = useCallback((): void => {
        void fetchNewerMessages();
    }, [fetchNewerMessages]);

    if (!selectedFriendId && !selectedChannelId) {
        return (
            <Box className="chat-background flex min-h-0 flex-1 flex-col">
                <ChatHeader
                    actions={headerActions}
                    friendUser={undefined}
                    memberList={{
                        isOpen: isMemberListOpen,
                        hideButton: hideMemberListButton,
                        onToggle: onToggleMemberList,
                    }}
                    selectedChannel={undefined}
                    selectedFriendId=""
                />
                <ChatEmptyState />
            </Box>
        );
    }

    const isServerContext = !!selectedServerId && !!selectedChannelId;

    const usernameStyle: UsernameStyle = {
        disableColors: currentUser?.settings?.disableCustomUsernameColors,
        disableCustomFonts:
            serverDetails?.disableCustomFonts ||
            currentUser?.settings?.disableCustomUsernameFonts,
        disableGlow: currentUser?.settings?.disableCustomUsernameGlow,
        disableGlowAndColors: serverDetails?.disableUsernameGlowAndCustomColor,
    };

    return (
        <Box
            className="chat-background relative flex min-h-0 flex-1 flex-col overflow-hidden"
            ref={chatLayoutRef}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div className="pointer-events-none absolute inset-x-0 top-0 z-50">
                <ChatHeader
                    actions={headerActions}
                    friendUser={friendUser}
                    hasVisibleStickyMessage={
                        isServerContext && hasVisibleStickyMessage
                    }
                    isSearchOpen={isSearchOpen}
                    isViewingOlderMessages={isViewingOlderMessages}
                    memberList={{
                        isOpen: isMemberListOpen,
                        hideButton: hideMemberListButton,
                        onToggle: onToggleMemberList,
                    }}
                    selectedChannel={selectedChannel}
                    selectedFriendId={selectedFriendId}
                    showPins={showPins}
                    onHeightChange={handleChatHeaderHeightChange}
                    onTogglePins={(): void => {
                        patchUi((s) => ({ showPins: !s.showPins }));
                    }}
                    onToggleSearch={(): void => {
                        patchUi((s) => ({ isSearchOpen: !s.isSearchOpen }));
                    }}
                />
            </div>

            {/* horizontal content row: main chat + search sidebar */}
            <div
                className="flex min-h-0 flex-1 overflow-hidden"
                style={{ paddingTop: 'var(--chat-header-height, 0px)' }}
            >
                <ChatMainColumn
                    canBypassSlowMode={canBypassSlowMode}
                    canSendMessages={canSendMessages}
                    chatContainerRef={chatContainerRef}
                    cooldown={cooldown}
                    discardMessage={discardMessage}
                    fileQueueResult={fileQueueResult}
                    friendUser={friendUser}
                    hasNextPage={hasNextPage}
                    hasVisibleStickyMessage={
                        isServerContext && hasVisibleStickyMessage
                    }
                    isAtBottom={isAtBottom}
                    isDragging={isDragging}
                    isFetchingNewerMessages={isFetchingNewerMessages}
                    isFetchingNextPage={isFetchingNextPage}
                    isLoading={isLoading}
                    isOwner={isOwner}
                    isServerContext={isServerContext}
                    isViewingOlderMessages={isViewingOlderMessages}
                    me={currentUser}
                    memberMaps={memberMaps}
                    messageChannelData={messageChannelData}
                    messagePermissions={messagePermissions}
                    messages={messages}
                    messagesListRef={messagesListRef}
                    quickReactions={quickReactions}
                    replyingTo={replyingTo}
                    resolvedTypingUsers={resolvedTypingUsers}
                    retryMessage={retryMessage}
                    selectedChannel={selectedChannel}
                    selectedChannelId={selectedChannelId}
                    selectedFriendId={selectedFriendId}
                    selectedServerId={selectedServerId}
                    sendMessage={sendMessage}
                    sendTyping={sendTyping}
                    serverDetails={serverDetails}
                    setCooldown={setCooldown}
                    targetMessageId={targetMessageId}
                    usernameStyle={usernameStyle}
                    onAtBottomChange={(atBottom): void => {
                        patchUi({ isAtBottom: atBottom });
                    }}
                    onCancelReply={(): void => {
                        patchUi({ replyingTo: null });
                    }}
                    onJumpToLatest={handleJumpToLatestSmooth}
                    onLoadMore={handleLoadMore}
                    onLoadNewer={handleLoadNewer}
                    onReplyClick={handleReplyClick}
                    onReplyToMessage={handleReplyToMessage}
                    onStickyVisibilityChange={handleStickyVisibilityChange}
                />

                <ChatSearchSidebar
                    channelId={selectedChannelId}
                    friendId={selectedFriendId}
                    isOpen={isSearchOpen}
                    serverId={selectedServerId}
                    onClose={(): void => {
                        patchUi({ isSearchOpen: false });
                    }}
                    onNavigateToMessage={handleNavigateToMessage}
                />
            </div>
        </Box>
    );
};
