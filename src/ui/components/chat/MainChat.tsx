import React, { useCallback, useEffect, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, m } from 'framer-motion';
import { ChevronDown, Upload, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

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
import { useKeybindManager } from '@/keybinds/useKeybindManager';
import { type Theme, useTheme } from '@/providers/ThemeProvider';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setTargetMessageId } from '@/store/slices/navSlice';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { ChatEmptyState } from '@/ui/components/chat/ChatEmptyState';
import { ChatHeader } from '@/ui/components/chat/ChatHeader';
import { MessageInput } from '@/ui/components/chat/MessageInput';
import { MessageSearchPanel } from '@/ui/components/chat/MessageSearchPanel';
import {
    MessagesList,
    type MessagesListHandle,
} from '@/ui/components/chat/MessagesList';
import { TypingIndicator } from '@/ui/components/chat/TypingIndicator';
import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { showInAppNotification } from '@/ui/notifications/inAppNotifications';
import { colors } from '@/ui/theme';
import { applyServalBackground } from '@/utils/servalFur';
import { WsEvents, wsClient, wsMessages } from '@/ws';

import { StickyMessageBar } from './StickyMessageBar';

const THEMES: Theme[] = [
    'serval',
    'dark',
    'deep-ocean',
    'light',
    'cherry',
    'high-contrast',
    'violet',
    'forest-green',
    'pride',
];

interface MainChatProps {
    requireUrlMatch?: boolean;
    headerActions?: React.ReactNode;
    onToggleMemberList?: () => void;
    isMemberListOpen?: boolean;
    hideMemberListButton?: boolean;
}

export const MainChat = ({
    requireUrlMatch = true,
    headerActions,
    onToggleMemberList,
    isMemberListOpen,
    hideMemberListButton,
}: MainChatProps) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
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

    const [isDragging, setIsDragging] = useState(false);
    const fileQueueResult = useFileQueue();
    const [replyingTo, setReplyingTo] = useState<ProcessedChatMessage | null>(
        null,
    );
    const [showPins, setShowPins] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [syncedConversationKey, setSyncedConversationKey] = useState(
        `${selectedFriendId ?? ''}:${selectedChannelId ?? ''}`,
    );
    const [debugTypingCount, setDebugTypingCount] = useState(0);
    const { theme, setTheme } = useTheme();
    const chatContainerRef = React.useRef<HTMLElement>(null);
    const messagesListRef = React.useRef<MessagesListHandle>(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const { spotCount, opacity, seed, base, spotColor } = useAppSelector(
        (state) => state.furTweaker,
    );

    React.useEffect((): (() => void) | undefined => {
        if (theme !== 'serval' || !chatContainerRef.current) return;

        const opts = {
            base,
            opacity,
            spotColor,
            spotCount: spotCount || undefined,
            seed,
        };

        const cleanup = applyServalBackground(chatContainerRef.current, opts);

        return (): void => {
            cleanup();
        };
    }, [theme, opacity, seed, base, spotColor, spotCount]);

    const { data: currentUser } = useMe();
    const queryClient = useQueryClient();
    const keybindManager = useKeybindManager(currentUser?.settings?.keybinds);

    useEffect((): (() => void) => {
        const handleKeyDown = (e: KeyboardEvent): void => {
            if (keybindManager.matches('debug.typing.more', e)) {
                e.preventDefault();
                e.stopPropagation();
                setDebugTypingCount((prev): number => (prev + 1) % 5);
            }
            if (keybindManager.matches('debug.typing.less', e)) {
                e.preventDefault();
                e.stopPropagation();
                setDebugTypingCount((prev): number => (prev - 1 + 5) % 5);
            }
            if (keybindManager.matches('debug.theme.previous', e)) {
                e.preventDefault();
                e.stopPropagation();
                const currentIndex = THEMES.indexOf(theme);
                const nextIndex =
                    (currentIndex - 1 + THEMES.length) % THEMES.length;
                setTheme(THEMES[nextIndex]);
            }
            if (keybindManager.matches('debug.theme.next', e)) {
                e.preventDefault();
                e.stopPropagation();
                const currentIndex = THEMES.indexOf(theme);
                const nextIndex = (currentIndex + 1) % THEMES.length;
                setTheme(THEMES[nextIndex]);
            }
            if (keybindManager.matches('debug.notification.example', e)) {
                e.preventDefault();
                e.stopPropagation();
                showInAppNotification({
                    title: 'Example Notification',
                    message: 'This is what a notification looks like!',
                    type: 'info',
                });
            }
            if (keybindManager.matches('debug.notification.dm', e)) {
                e.preventDefault();
                e.stopPropagation();
                const dmId = `__debug_dm_${Date.now()}`;
                const debugSenderId = `${currentUser?.id ?? '__debug'}_debug`;
                if (currentUser) {
                    queryClient.setQueryData(['user', debugSenderId], {
                        ...currentUser,
                        id: debugSenderId,
                    });
                }
                wsClient.simulateEvent(WsEvents.MESSAGE_DM, {
                    id: dmId,
                    messageId: dmId,
                    senderId: debugSenderId,
                    senderUsername: currentUser?.username ?? 'Unknown',
                    senderProfilePicture: currentUser?.profilePicture ?? null,
                    receiverId: currentUser?.id ?? '__debug_me__',
                    receiverUsername: currentUser?.username ?? 'Unknown',
                    text: 'Hey, how are you doing?',
                    createdAt: new Date().toISOString(),
                    isEdited: false,
                    isPinned: false,
                    isSticky: false,
                    isWebhook: false,
                    stickerId: null,
                    poll: null,
                    embeds: [],
                    attachments: [],
                    reactions: [],
                    interaction: null,
                    senderIsBot: false,
                });
            }
            if (keybindManager.matches('debug.notification.mention', e)) {
                e.preventDefault();
                e.stopPropagation();
                const mentionId = `__debug_mention_${Date.now()}`;
                const debugSenderId = `${currentUser?.id ?? '__debug'}_debug`;
                if (currentUser) {
                    queryClient.setQueryData(['user', debugSenderId], {
                        ...currentUser,
                        id: debugSenderId,
                    });
                }
                wsClient.simulateEvent(WsEvents.MENTION, {
                    type: 'mention',
                    senderId: debugSenderId,
                    sender:
                        currentUser?.displayName ??
                        currentUser?.username ??
                        'Unknown',
                    serverId: '__debug_server__',
                    channelId: '__debug_channel__',
                    message: {
                        id: mentionId,
                        messageId: mentionId,
                        serverId: '__debug_server__',
                        channelId: '__debug_channel__',
                        senderId: debugSenderId,
                        senderUsername: currentUser?.username ?? 'Unknown',
                        senderProfilePicture:
                            currentUser?.profilePicture ?? null,
                        text: `Hey @${currentUser?.username ?? 'you'}, check this out!`,
                        createdAt: new Date().toISOString(),
                        isEdited: false,
                        isPinned: false,
                        isSticky: false,
                        isWebhook: false,
                        embeds: [],
                        attachments: [],
                        reactions: [],
                        interaction: null,
                        stickerId: null,
                        poll: null,
                        senderIsBot: false,
                    },
                });
            }
        };
        window.addEventListener('keydown', handleKeyDown, true);
        return (): void =>
            window.removeEventListener('keydown', handleKeyDown, true);
    }, [keybindManager, theme, setTheme, currentUser]);

    const { data: friendUser, isError: isFriendError } = useUserById(
        selectedFriendId ?? '',
        {
            enabled: !!selectedFriendId,
        },
    );
    const serverIdFromUrl = location.pathname
        .split('/@server/')[1]
        ?.split('/')[0];
    const isServerContextReady =
        !!selectedServerId &&
        (!requireUrlMatch ||
            (!!serverIdFromUrl && selectedServerId === serverIdFromUrl));

    const { data: serverDetails } = useServerDetails(selectedServerId, {
        enabled: isServerContextReady,
    });
    const { data: channels } = useChannels(selectedServerId, {
        enabled: isServerContextReady,
    });
    const { data: members } = useMembers(selectedServerId, {
        enabled: isServerContextReady,
    });
    const { data: roles } = useRoles(selectedServerId, {
        enabled: isServerContextReady,
    });
    const { hasPermission, isOwner, isTimedOut } = usePermissions(
        selectedServerId,
        selectedChannelId,
        { enabled: isServerContextReady },
    );
    const { data: pings } = usePings();
    const { mutate: clearChannelPings } = useClearChannelPings();
    const { mutate: deletePing } = useDeletePing();

    const canSendMessages =
        !selectedServerId || hasPermission('sendMessages') || isTimedOut;

    const selectedChannel = React.useMemo(
        () => channels?.find((c): boolean => c.id === selectedChannelId),
        [channels, selectedChannelId],
    );

    const {
        serverMemberMap,
        fullMemberMap,
        roleMap,
        userRolesMap,
        highestRoleMap,
        iconRoleMap,
    } = useMemberMaps(members, roles);

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

    const { sendMessage, sendTyping, typingUsers } = useChatWS(
        selectedFriendId ?? undefined,
        selectedServerId ?? undefined,
        selectedChannelId ?? undefined,
    );

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
                    const member = fullMemberMap.get(u.userId);
                    const resolvedName =
                        member?.nickname ||
                        member?.user?.displayName ||
                        u.username;
                    return { ...u, username: resolvedName };
                },
            ),
        [typingUsersWithDebug, fullMemberMap],
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

    const handleJumpToLatest = React.useCallback((): void => {
        dispatch(setTargetMessageId(null));
        if (selectedServerId && selectedChannelId) {
            void navigate(
                `/chat/@server/${selectedServerId}/channel/${selectedChannelId}`,
            );
        } else if (selectedFriendId) {
            void navigate(`/chat/@user/${selectedFriendId}`);
        }
    }, [
        dispatch,
        selectedServerId,
        selectedChannelId,
        selectedFriendId,
        navigate,
    ]);

    React.useEffect((): void => {
        if (isFriendError && selectedFriendId) {
            void navigate('/chat/@me', { replace: true });
        }
    }, [isFriendError, selectedFriendId, navigate]);

    // close search whenever the active conversation changes
    const conversationKey = `${selectedFriendId ?? ''}:${selectedChannelId ?? ''}`;
    if (conversationKey !== syncedConversationKey) {
        setSyncedConversationKey(conversationKey);
        setIsSearchOpen(false);
    }

    const handleNavigateToMessage = useCallback(
        (messageId: string): void => {
            dispatch(setTargetMessageId(messageId));
            if (selectedServerId && selectedChannelId) {
                void navigate(
                    `/chat/@server/${selectedServerId}/channel/${selectedChannelId}/message/${messageId}`,
                );
            } else if (selectedFriendId) {
                void navigate(
                    `/chat/@user/${selectedFriendId}/message/${messageId}`,
                );
            }
        },
        [
            dispatch,
            navigate,
            selectedServerId,
            selectedChannelId,
            selectedFriendId,
        ],
    );

    React.useEffect((): void => {
        if (selectedServerId && selectedChannelId) {
            wsMessages.markChannelRead(selectedServerId, selectedChannelId);

            if (pings?.pings) {
                const hasPingsInActiveChannel = pings.pings.some(
                    (p): boolean => p.channelId === selectedChannelId,
                );
                if (hasPingsInActiveChannel) {
                    clearChannelPings(selectedChannelId);
                }
            }
        } else if (selectedFriendId) {
            wsMessages.markDmRead(selectedFriendId);
            if (pings?.pings) {
                const friendPings = pings.pings.filter(
                    (p): boolean =>
                        p.senderId === selectedFriendId && !p.serverId,
                );
                if (friendPings.length > 0) {
                    friendPings.forEach((p): void => deletePing(p.id));
                }
            }
        }
    }, [
        selectedChannelId,
        selectedServerId,
        selectedFriendId,
        clearChannelPings,
        deletePing,
        messages,
        pings?.pings,
    ]);

    const handleReplyClick = React.useCallback(
        (messageId: string): void => {
            if (selectedServerId && selectedChannelId) {
                void navigate(
                    `/chat/@server/${selectedServerId}/channel/${selectedChannelId}/message/${messageId}`,
                );
            } else if (selectedFriendId) {
                void navigate(
                    `/chat/@user/${selectedFriendId}/message/${messageId}`,
                );
            }
        },
        [navigate, selectedServerId, selectedChannelId, selectedFriendId],
    );

    const handleReplyToMessage = React.useCallback(
        (msg: ProcessedChatMessage): void => {
            setReplyingTo(msg);
        },
        [],
    );

    const handleLoadMore = React.useCallback((): void => {
        void fetchNextPage();
    }, [fetchNextPage]);

    if (!selectedFriendId && !selectedChannelId) {
        return (
            <Box className="chat-background flex min-h-0 flex-1 flex-col">
                <ChatHeader
                    actions={headerActions}
                    friendUser={undefined}
                    hideMemberListButton={hideMemberListButton}
                    isMemberListOpen={isMemberListOpen}
                    selectedChannel={undefined}
                    selectedFriendId=""
                    onToggleMemberList={onToggleMemberList}
                />
                <ChatEmptyState />
            </Box>
        );
    }

    const isServerContext = !!selectedServerId && !!selectedChannelId;

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
                hideMemberListButton={hideMemberListButton}
                isMemberListOpen={isMemberListOpen}
                isSearchOpen={isSearchOpen}
                selectedChannel={selectedChannel}
                selectedFriendId={selectedFriendId}
                showPins={showPins}
                onToggleMemberList={onToggleMemberList}
                onTogglePins={(): void => setShowPins((v): boolean => !v)}
                onToggleSearch={(): void => setIsSearchOpen((v): boolean => !v)}
            />

            {/* horizontal content row: main chat + search sidebar */}
            <div className="flex min-h-0 flex-1 overflow-hidden">
                {/* main chat column */}
                <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
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
                                type="button"
                                onClick={handleJumpToLatest}
                            >
                                <X size={16} />
                                <span className="text-sm">Jump to latest</span>
                            </button>
                        </Box>
                    )}

                    {selectedChannel?.type === 'voice' ? (
                        <Box
                            className="chat-background flex flex-1 items-center justify-center p-8"
                            ref={chatContainerRef}
                        >
                            <Text className="text-muted-foreground">
                                This is a Voice Channel. Connect to it via the
                                sidebar.
                            </Text>
                        </Box>
                    ) : (
                        <>
                            <Box
                                className="relative flex min-h-0 flex-1 flex-col"
                                ref={chatContainerRef}
                            >
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
                                    fullMemberMap={fullMemberMap}
                                    hasMore={hasNextPage}
                                    hasMoreNewer={isViewingOlderMessages}
                                    hasPermission={hasPermission}
                                    isLoading={isLoading}
                                    isLoadingMore={isFetchingNextPage}
                                    isOwner={isOwner}
                                    key={selectedChannelId || selectedFriendId}
                                    me={currentUser}
                                    messages={messages}
                                    ref={messagesListRef}
                                    roleMap={roleMap}
                                    serverDetails={serverDetails}
                                    userRolesMap={userRolesMap}
                                    onAtBottomChange={setIsAtBottom}
                                    onLoadMore={handleLoadMore}
                                    onLoadMoreNewer={handleJumpToLatest}
                                    onReplyClick={handleReplyClick}
                                    onReplyToMessage={handleReplyToMessage}
                                />
                                {!isAtBottom && (
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
                                        !!selectedChannel?.slowMode &&
                                        selectedChannel.slowMode > 0
                                    }
                                    typingUsers={resolvedTypingUsers}
                                />
                            </Box>

                            {canSendMessages ? (
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
                                    sendMessage={sendMessage}
                                    sendTyping={sendTyping}
                                    setCooldown={setCooldown}
                                    onCancelReply={(): void =>
                                        setReplyingTo(null)
                                    }
                                />
                            ) : (
                                <Box className="pride-glass-input mx-4 mb-4 flex h-[56px] items-center rounded-lg border border-border-subtle bg-[var(--bg-msg-input)] px-4">
                                    <Text
                                        className="text-muted-foreground"
                                        size="sm"
                                    >
                                        You can&apos;t type in this channel.
                                    </Text>
                                </Box>
                            )}

                            {isDragging && (
                                <Box className="animate-in fade-in zoom-in pointer-events-none absolute inset-0 z-[var(--z-index-backdrop)] m-4 flex flex-col items-center justify-center rounded-3xl border-4 border-dashed border-primary/50 bg-bg-primary/80 p-8 backdrop-blur-sm transition-all duration-200">
                                    <div className="mb-4 rounded-full bg-primary/10 p-6">
                                        <Upload
                                            className="text-primary"
                                            size={48}
                                        />
                                    </div>
                                    <Text size="xl" weight="bold">
                                        Drop files to upload
                                    </Text>
                                </Box>
                            )}
                        </>
                    )}
                </div>

                {/* search sidebar, slides in from the right */}
                <AnimatePresence>
                    {isSearchOpen && (
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
                                    channelId={selectedChannelId ?? undefined}
                                    mode={selectedFriendId ? 'dm' : 'channel'}
                                    otherUserId={selectedFriendId ?? undefined}
                                    serverId={selectedServerId ?? undefined}
                                    onClose={(): void => setIsSearchOpen(false)}
                                    onNavigateToMessage={
                                        handleNavigateToMessage
                                    }
                                />
                            </div>
                        </m.aside>
                    )}
                </AnimatePresence>
            </div>
        </Box>
    );
};
