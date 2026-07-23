import React, { useCallback, useReducer, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, m } from 'framer-motion';
import { ChevronDown, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type { Channel } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import { useChatConversationActions } from '@/hooks/chat/useChatConversationActions';
import { useChatDebugKeybinds } from '@/hooks/chat/useChatDebugKeybinds';
import { useFileQueue } from '@/hooks/chat/useFileQueue';
import { useMainChatData } from '@/hooks/chat/useMainChatData';
import { useServalBackground } from '@/hooks/chat/useServalBackground';
import { useKeybindManager } from '@/keybinds/useKeybindManager';
import { useTheme } from '@/providers/ThemeProvider';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { ChatEmptyState } from '@/ui/components/chat/ChatEmptyState';
import { ChatHeader } from '@/ui/components/chat/ChatHeader';
import { MessageInput } from '@/ui/components/chat/MessageInput';
import { MessageSearchPanel } from '@/ui/components/chat/MessageSearchPanel';
import {
    MessagesList,
    type MessagesListHandle,
} from '@/ui/components/chat/MessagesList';
import { MessagesListNative } from '@/ui/components/chat/MessagesListNative';
import { TypingIndicator } from '@/ui/components/chat/TypingIndicator';
import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
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

// Prototype toggle: set `localStorage.nativeMessages = '1'` and reload to
// swap in the non-virtualized MessagesListNative. Remove once a direction
// is chosen.
const useNativeMessages = ((): boolean => {
    try {
        return (
            typeof localStorage !== 'undefined' &&
            localStorage.getItem('nativeMessages') === '1'
        );
    } catch {
        return false;
    }
})();
const MessagesListComponent = useNativeMessages
    ? MessagesListNative
    : MessagesList;

const dragHasFiles = (dataTransfer: DataTransfer): boolean =>
    Array.from(dataTransfer.types).includes('Files');

interface UsernameStyle {
    disableColors?: boolean;
    disableCustomFonts?: boolean;
    disableGlow?: boolean;
    disableGlowAndColors?: boolean;
}

interface ChatMainColumnProps {
    isServerContext: boolean;
    selectedServerId: string | null;
    selectedChannelId: string | null;
    selectedFriendId: string | null;
    isViewingOlderMessages: boolean;
    selectedChannel: Channel | undefined;
    chatContainerRef: React.RefObject<HTMLElement | null>;
    messagesListRef: React.RefObject<MessagesListHandle | null>;
    targetMessageId: string | null;
    me: React.ComponentProps<typeof MessagesList>['me'];
    serverDetails: ChatData['serverDetails'];
    usernameStyle: UsernameStyle;
    memberMaps: ChatData['memberMaps'];
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    isLoading: boolean;
    hasPermission: ChatData['hasPermission'];
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
    isDragging: boolean;
    onAtBottomChange: (isAtBottom: boolean) => void;
    onJumpToLatest: () => void;
    onLoadMore: () => void;
    onReplyClick: (messageId: string) => void;
    onReplyToMessage: (msg: ProcessedChatMessage) => void;
    onCancelReply: () => void;
}

const ChatMainColumn = ({
    isServerContext,
    selectedServerId,
    selectedChannelId,
    selectedFriendId,
    isViewingOlderMessages,
    selectedChannel,
    chatContainerRef,
    messagesListRef,
    targetMessageId,
    me,
    serverDetails,
    usernameStyle,
    memberMaps,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    hasPermission,
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
    isDragging,
    onAtBottomChange,
    onJumpToLatest,
    onLoadMore,
    onReplyClick,
    onReplyToMessage,
    onCancelReply,
}: ChatMainColumnProps): React.ReactNode => (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {isServerContext && selectedChannelId && selectedServerId ? (
            <StickyMessageBar
                channelId={selectedChannelId}
                serverId={selectedServerId}
            />
        ) : null}

        {isViewingOlderMessages ? (
            <Box className="bg-warning/10 border-warning/30 flex items-center justify-between border-b px-6 py-3">
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
                    className="relative flex min-h-0 flex-1 flex-col"
                    ref={chatContainerRef}
                >
                    <MessagesListComponent
                        activeHighlightId={targetMessageId}
                        disableColors={usernameStyle.disableColors}
                        disableCustomFonts={usernameStyle.disableCustomFonts}
                        disableGlow={usernameStyle.disableGlow}
                        disableGlowAndColors={
                            usernameStyle.disableGlowAndColors
                        }
                        fullMemberMap={memberMaps.fullMemberMap}
                        hasMore={hasNextPage}
                        hasMoreNewer={isViewingOlderMessages}
                        hasPermission={hasPermission}
                        isLoading={isLoading}
                        isLoadingMore={isFetchingNextPage}
                        isOwner={isOwner}
                        key={selectedChannelId || selectedFriendId}
                        me={me}
                        messages={messages}
                        ref={messagesListRef}
                        roleMap={memberMaps.roleMap}
                        serverDetails={serverDetails}
                        userRolesMap={memberMaps.userRolesMap}
                        onAtBottomChange={onAtBottomChange}
                        onLoadMore={onLoadMore}
                        onLoadMoreNewer={onJumpToLatest}
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
                            }}
                            variant="normal"
                            onClick={(): void =>
                                messagesListRef.current?.scrollToBottom()
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
                    <Box className="animate-in fade-in zoom-in pointer-events-none absolute inset-0 z-[var(--z-index-backdrop)] m-4 flex flex-col items-center justify-center rounded-3xl border-4 border-dashed border-primary/50 bg-bg-primary/80 p-8 backdrop-blur-sm transition-all duration-200">
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
                animate={{ width: 360 }}
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
                        width: 360,
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
    const messagesListRef = useRef<MessagesListHandle>(null);

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

    const {
        friendUser,
        isFriendError,
        serverDetails,
        hasPermission,
        isOwner,
        pings,
        clearChannelPings,
        deletePing,
        canSendMessages,
        selectedChannel,
        memberMaps,
        messages,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isViewingOlderMessages,
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
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <ChatHeader
                actions={headerActions}
                friendUser={friendUser}
                isSearchOpen={isSearchOpen}
                memberList={{
                    isOpen: isMemberListOpen,
                    hideButton: hideMemberListButton,
                    onToggle: onToggleMemberList,
                }}
                selectedChannel={selectedChannel}
                selectedFriendId={selectedFriendId}
                showPins={showPins}
                onTogglePins={(): void => {
                    patchUi((s) => ({ showPins: !s.showPins }));
                }}
                onToggleSearch={(): void => {
                    patchUi((s) => ({ isSearchOpen: !s.isSearchOpen }));
                }}
            />

            {/* horizontal content row: main chat + search sidebar */}
            <div className="flex min-h-0 flex-1 overflow-hidden">
                <ChatMainColumn
                    canBypassSlowMode={canBypassSlowMode}
                    canSendMessages={canSendMessages}
                    chatContainerRef={chatContainerRef}
                    cooldown={cooldown}
                    fileQueueResult={fileQueueResult}
                    hasNextPage={hasNextPage}
                    hasPermission={hasPermission}
                    isAtBottom={isAtBottom}
                    isDragging={isDragging}
                    isFetchingNextPage={isFetchingNextPage}
                    isLoading={isLoading}
                    isOwner={isOwner}
                    isServerContext={isServerContext}
                    isViewingOlderMessages={isViewingOlderMessages}
                    me={currentUser}
                    memberMaps={memberMaps}
                    messages={messages}
                    messagesListRef={messagesListRef}
                    replyingTo={replyingTo}
                    resolvedTypingUsers={resolvedTypingUsers}
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
                    onJumpToLatest={handleJumpToLatest}
                    onLoadMore={handleLoadMore}
                    onReplyClick={handleReplyClick}
                    onReplyToMessage={handleReplyToMessage}
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
