import React, {
    useCallback,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    useTransition,
} from 'react';

import { ChevronDown, ChevronRight } from 'lucide-react';

import type {
    Channel,
    Role,
    RolePermissions,
    Server,
    ServerMember,
} from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { useAppSelector } from '@/store/hooks';
import { BlockFlags } from '@/types/blocks';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { ChannelStartHeader } from '@/ui/components/chat/ChannelStartHeader';
import { MessageItem } from '@/ui/components/chat/MessageItem';
import { Button } from '@/ui/components/common/Button';
import { Divider } from '@/ui/components/common/Divider';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { VerticalSpacer } from '@/ui/components/layout/VerticalSpacer';
import { ScrollSpring } from '@/utils/scrollSpring';
import { formatDateSeparator, isSameDay } from '@/utils/timestamp';

import { ChatSkeleton } from './ChatSkeleton';

export interface MessagesListHandle {
    scrollToBottom: (onSettled?: () => void) => void;
}

export interface MessagesListProps {
    ref?: React.Ref<MessagesListHandle>;
    messages: ProcessedChatMessage[];
    onLoadMore?: () => void;
    hasMore?: boolean;
    isLoading?: boolean;
    isLoadingMore?: boolean;
    onLoadMoreNewer?: () => void;
    hasMoreNewer?: boolean;
    isLoadingMoreNewer?: boolean;
    onReplyClick?: (messageId: string) => void;
    onReplyToMessage?: (message: ProcessedChatMessage) => void;
    onAtBottomChange?: (isAtBottom: boolean) => void;
    activeHighlightId?: string | null;
    disableCustomFonts?: boolean;
    disableGlowAndColors?: boolean;
    disableColors?: boolean;
    disableGlow?: boolean;
    me?: User;
    serverDetails?: Server;
    selectedChannel?: Channel;
    friendUser?: User;
    hasPermission?: (permission: keyof RolePermissions) => boolean;
    isOwner?: boolean;
    fullMemberMap?: Map<string, ServerMember>;
    userRolesMap?: Map<string, Role[]>;
    roleMap?: Map<string, Role>;
    retryMessage?: (localId: string) => void;
    discardMessage?: (localId: string) => void;
}

const AT_BOTTOM_TOLERANCE_PX = 2;
const LOAD_MORE_TRIGGER_PX = 500;
const CORRECTION_THRESHOLD_PX = 1;

type VirtualItemData =
    | { type: 'channel-start' }
    | {
          type: 'message';
          message: ProcessedChatMessage;
          prevMessage?: ProcessedChatMessage;
      }
    | {
          type: 'blocked-group';
          messages: ProcessedChatMessage[];
          id: string;
      }
    | { type: 'date-separator'; date: string; id: string }
    | { type: 'loader-older' }
    | { type: 'loader-newer' };

const itemKey = (item: VirtualItemData): string => {
    if (item.type === 'message') return item.message.id;
    if (item.type === 'blocked-group') return item.id;
    if (item.type === 'date-separator') return item.id;
    return item.type;
};

export const MessagesList = React.memo(
    ({
        ref,
        messages,
        onLoadMore,
        hasMore,
        isLoading,
        isLoadingMore,
        onLoadMoreNewer,
        hasMoreNewer,
        isLoadingMoreNewer,
        onReplyClick,
        onReplyToMessage,
        onAtBottomChange,
        activeHighlightId,
        disableCustomFonts,
        disableGlowAndColors,
        disableColors,
        disableGlow,
        me,
        serverDetails,
        selectedChannel,
        friendUser,
        hasPermission,
        isOwner,
        fullMemberMap,
        userRolesMap,
        roleMap,
        retryMessage,
        discardMessage,
    }: MessagesListProps) => {
        const blocks = useAppSelector(
            (state): Record<string, number> => state.blocking.blocks,
        );

        const scrollerElRef = useRef<HTMLDivElement | null>(null);

        const pinnedRef = useRef(true);
        const anchorRef = useRef<{ id: string; offsetFromTop: number } | null>(
            null,
        );
        const isRestoringRef = useRef(false);
        const springRef = useRef<ScrollSpring | null>(null);

        const [isAtBottom, setIsAtBottom] = useState(true);
        const onAtBottomChangeRef = useRef(onAtBottomChange);
        useLayoutEffect((): void => {
            onAtBottomChangeRef.current = onAtBottomChange;
        });
        useEffect((): void => {
            onAtBottomChangeRef.current?.(isAtBottom);
        }, [isAtBottom]);

        const [highlightId, setInternalHighlightId] = useState<string | null>(
            null,
        );
        const [, startTransitionHighlight] = useTransition();

        useEffect((): void => {
            startTransitionHighlight((): void => {
                setInternalHighlightId(activeHighlightId ?? null);
            });
        }, [activeHighlightId]);

        useEffect((): (() => void) | undefined => {
            if (!highlightId) return;
            const timer = setTimeout((): void => {
                setInternalHighlightId(null);
            }, 2000);

            return (): void => {
                clearTimeout(timer);
            };
        }, [highlightId]);

        const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
            new Set(),
        );
        const toggleGroup = useCallback((groupId: string): void => {
            setExpandedGroups((prev): Set<string> => {
                const next = new Set(prev);
                if (next.has(groupId)) {
                    next.delete(groupId);
                } else {
                    next.add(groupId);
                }
                return next;
            });
        }, []);

        const [hasSettled, setHasSettled] = useState(false);

        const items = useMemo((): VirtualItemData[] => {
            const list: VirtualItemData[] = [];

            if (hasMore) {
                list.push({ type: 'loader-older' });
            } else if (selectedChannel || friendUser) {
                list.push({ type: 'channel-start' });
            }

            let currentBlockedGroup: ProcessedChatMessage[] = [];
            let prevMsg: ProcessedChatMessage | undefined;

            const flushBlockedGroup = (): void => {
                if (currentBlockedGroup.length === 0) return;
                list.push({
                    type: 'blocked-group',
                    messages: [...currentBlockedGroup],
                    // safe: guarded by the length === 0 early-return above.
                    id: `blocked-${currentBlockedGroup[0]!.id}`,
                });
                currentBlockedGroup = [];
            };

            for (const msg of messages) {
                const senderBlocks = blocks[msg.senderId] || 0;
                const isSenderBlocked = !!(
                    senderBlocks & BlockFlags.HIDE_MESSAGES
                );

                const replyToSenderId = msg.replyTo?.user?.id;
                const isReplyToBlocked =
                    replyToSenderId &&
                    !!(
                        (blocks[replyToSenderId] || 0) & BlockFlags.HIDE_REPLIES
                    );

                if (isSenderBlocked || isReplyToBlocked) {
                    currentBlockedGroup.push(msg);
                } else {
                    flushBlockedGroup();
                    if (
                        prevMsg &&
                        !isSameDay(prevMsg.createdAt, msg.createdAt)
                    ) {
                        list.push({
                            type: 'date-separator',
                            date: msg.createdAt,
                            id: `date-${msg.id}`,
                        });
                    }
                    const lastItem = list.at(-1);
                    list.push({
                        type: 'message',
                        message: msg,
                        prevMessage:
                            lastItem?.type === 'message'
                                ? lastItem.message
                                : undefined,
                    });
                }

                prevMsg = msg;
            }

            flushBlockedGroup();

            if (hasMoreNewer) {
                list.push({ type: 'loader-newer' });
            }

            return list;
        }, [
            messages,
            blocks,
            hasMore,
            hasMoreNewer,
            selectedChannel,
            friendUser,
        ]);

        const isReady =
            !isLoading &&
            (!activeHighlightId ||
                messages.some((m): boolean => m.id === activeHighlightId));


        const maxScrollTop = (el: HTMLElement): number =>
            Math.max(0, el.scrollHeight - el.clientHeight);

        const writeScrollTop = useCallback(
            (el: HTMLElement, value: number): void => {
                isRestoringRef.current = true;
                el.scrollTop = value;
                isRestoringRef.current = false;
            },
            [],
        );

        const captureAnchor = useCallback((): void => {
            const el = scrollerElRef.current;
            if (!el) return;
            if (pinnedRef.current) {
                anchorRef.current = null;
                return;
            }
            const nodes = el.querySelectorAll<HTMLElement>('[id^="message-"]');
            for (const node of nodes) {
                const offsetTop = node.offsetTop;
                if (offsetTop >= el.scrollTop) {
                    anchorRef.current = {
                        id: node.id.slice('message-'.length),
                        offsetFromTop: offsetTop - el.scrollTop,
                    };
                    return;
                }
            }
            anchorRef.current = null;
        }, []);

        const restorePosition = useCallback((): void => {
            const el = scrollerElRef.current;
            if (!el) return;
            if (springRef.current?.isAnimating()) return;

            if (pinnedRef.current) {
                const target = maxScrollTop(el);
                if (Math.abs(el.scrollTop - target) > AT_BOTTOM_TOLERANCE_PX) {
                    writeScrollTop(el, target);
                }
                return;
            }

            const anchor = anchorRef.current;
            if (!anchor) return;
            const node = el.querySelector<HTMLElement>(
                `[id="message-${CSS.escape(anchor.id)}"]`,
            );
            if (!node) return;

            const target = node.offsetTop - anchor.offsetFromTop;
            const delta = target - el.scrollTop;
            if (Math.abs(delta) < CORRECTION_THRESHOLD_PX) return;

            writeScrollTop(el, Math.max(0, target));
        }, [writeScrollTop]);


        const loadMorePausedRef = useRef(false);
        const prevMessageCountRef = useRef(messages.length);
        const prevIsLoadingMoreRef = useRef(isLoadingMore);
        useEffect((): void => {
            if (prevIsLoadingMoreRef.current && !isLoadingMore) {
                const grew = messages.length - prevMessageCountRef.current;
                if (hasMore && grew < 5) {
                    loadMorePausedRef.current = true;
                }
            }
            prevIsLoadingMoreRef.current = isLoadingMore;
            prevMessageCountRef.current = messages.length;
        }, [isLoadingMore, messages.length, hasMore]);

        const loadMoreNewerPausedRef = useRef(false);
        const prevMessageCountForNewerRef = useRef(messages.length);
        const prevIsLoadingMoreNewerRef = useRef(isLoadingMoreNewer);
        useEffect((): void => {
            if (prevIsLoadingMoreNewerRef.current && !isLoadingMoreNewer) {
                const grew =
                    messages.length - prevMessageCountForNewerRef.current;
                if (hasMoreNewer && grew < 5) {
                    loadMoreNewerPausedRef.current = true;
                }
            }
            prevIsLoadingMoreNewerRef.current = isLoadingMoreNewer;
            prevMessageCountForNewerRef.current = messages.length;
        }, [isLoadingMoreNewer, messages.length, hasMoreNewer]);

        const onLoadMoreRef = useRef(onLoadMore);
        const loadMoreStateRef = useRef({ hasMore, isLoadingMore });
        const onLoadMoreNewerRef = useRef(onLoadMoreNewer);
        const loadMoreNewerStateRef = useRef({
            hasMoreNewer,
            isLoadingMoreNewer,
        });
        useLayoutEffect((): void => {
            onLoadMoreRef.current = onLoadMore;
            loadMoreStateRef.current = { hasMore, isLoadingMore };
            onLoadMoreNewerRef.current = onLoadMoreNewer;
            loadMoreNewerStateRef.current = {
                hasMoreNewer,
                isLoadingMoreNewer,
            };
        });

        const syncScrollState = useCallback((): void => {
            const el = scrollerElRef.current;
            if (!el) return;
            const atBottom =
                maxScrollTop(el) - el.scrollTop <= AT_BOTTOM_TOLERANCE_PX;
            pinnedRef.current = atBottom && !activeHighlightId;
            setIsAtBottom(pinnedRef.current);
            captureAnchor();
        }, [activeHighlightId, captureAnchor]);

        const handleScroll = useCallback((): void => {
            const el = scrollerElRef.current;
            if (!el || isRestoringRef.current) return;
            if (springRef.current?.isAnimating()) return;

            syncScrollState();

            if (el.scrollTop > LOAD_MORE_TRIGGER_PX) {
                loadMorePausedRef.current = false;
            } else {
                const { hasMore: more, isLoadingMore: loading } =
                    loadMoreStateRef.current;
                if (more && !loading && !loadMorePausedRef.current) {
                    onLoadMoreRef.current?.();
                }
            }

            if (maxScrollTop(el) - el.scrollTop > LOAD_MORE_TRIGGER_PX) {
                loadMoreNewerPausedRef.current = false;
            } else {
                const {
                    hasMoreNewer: moreNewer,
                    isLoadingMoreNewer: loadingNewer,
                } = loadMoreNewerStateRef.current;
                if (
                    moreNewer &&
                    !loadingNewer &&
                    !loadMoreNewerPausedRef.current
                ) {
                    onLoadMoreNewerRef.current?.();
                }
            }
        }, [syncScrollState]);

        const cancelSpring = useCallback((): void => {
            if (!springRef.current?.isAnimating()) return;
            springRef.current.cancel();
            syncScrollState();
        }, [syncScrollState]);


        useLayoutEffect((): void => {
            restorePosition();
        });

        useLayoutEffect((): (() => void) | undefined => {
            const el = scrollerElRef.current;
            if (!el || typeof ResizeObserver === 'undefined') return;

            const observer = new ResizeObserver((): void => {
                restorePosition();
            });
            for (const child of el.children) observer.observe(child);
            return (): void => {
                observer.disconnect();
            };
        }, [restorePosition, items.length]);

        const placedForRef = useRef<string | null>(null);
        useLayoutEffect((): void => {
            if (!isReady) {
                cancelSpring();
                return;
            }
            const el = scrollerElRef.current;
            if (!el) return;

            const targetKey = activeHighlightId ?? '__bottom__';
            if (placedForRef.current === targetKey) return;
            placedForRef.current = targetKey;

            cancelSpring();

            if (activeHighlightId) {
                const node = el.querySelector<HTMLElement>(
                    `[id="message-${CSS.escape(activeHighlightId)}"]`,
                );
                if (node) {
                    pinnedRef.current = false;
                    writeScrollTop(
                        el,
                        Math.max(
                            0,
                            node.offsetTop -
                                el.clientHeight / 2 +
                                node.offsetHeight / 2,
                        ),
                    );
                    captureAnchor();
                }
            } else {
                pinnedRef.current = true;
                writeScrollTop(el, maxScrollTop(el));
            }

            setHasSettled(true);
        }, [
            isReady,
            activeHighlightId,
            writeScrollTop,
            captureAnchor,
            cancelSpring,
        ]);

        useEffect((): void => {
            if (!isReady) {
                placedForRef.current = null;
                setHasSettled(false);
            }
        }, [isReady]);


        const springWrite = useCallback(
            (value: number): void => {
                const el = scrollerElRef.current;
                if (el) writeScrollTop(el, value);
            },
            [writeScrollTop],
        );

        useEffect((): (() => void) => {
            const spring = new ScrollSpring(springWrite, {
                tension: 200,
                friction: 35,
                mass: 2,
                clamp: true,
            });
            springRef.current = spring;
            return (): void => {
                spring.destroy();
                springRef.current = null;
            };
        }, [springWrite]);

        const settleAfterSpring = useCallback((): void => {
            captureAnchor();
            restorePosition();
            setIsAtBottom(pinnedRef.current);
        }, [captureAnchor, restorePosition]);

        const springTo = useCallback(
            (to: number, onSettled?: () => void): void => {
                const el = scrollerElRef.current;
                const spring = springRef.current;
                if (!el) {
                    onSettled?.();
                    return;
                }
                if (!spring) {
                    writeScrollTop(el, to);
                    settleAfterSpring();
                    onSettled?.();
                    return;
                }
                spring.to({
                    to,
                    from: el.scrollTop,
                    animate: true,
                    callback: (): void => {
                        settleAfterSpring();
                        onSettled?.();
                    },
                });
            },
            [writeScrollTop, settleAfterSpring],
        );

        useEffect((): (() => void) | undefined => {
            const el = scrollerElRef.current;
            if (!el) return;
            const onGesture = (): void => {
                cancelSpring();
            };
            el.addEventListener('wheel', onGesture, { passive: true });
            el.addEventListener('touchstart', onGesture, { passive: true });
            el.addEventListener('mousedown', onGesture);
            el.addEventListener('keydown', onGesture);
            return (): void => {
                el.removeEventListener('wheel', onGesture);
                el.removeEventListener('touchstart', onGesture);
                el.removeEventListener('mousedown', onGesture);
                el.removeEventListener('keydown', onGesture);
            };
        }, [cancelSpring]);

        const scrollToBottom = useCallback(
            (onSettled?: () => void): void => {
                const el = scrollerElRef.current;
                if (!el) {
                    onSettled?.();
                    return;
                }
                pinnedRef.current = true;
                anchorRef.current = null;
                setIsAtBottom(true);
                springTo(maxScrollTop(el), onSettled);
            },
            [springTo],
        );

        useImperativeHandle(
            ref,
            (): MessagesListHandle => ({ scrollToBottom }),
            [scrollToBottom],
        );

        const onReplyClickRef = useRef(onReplyClick);
        useLayoutEffect((): void => {
            onReplyClickRef.current = onReplyClick;
        });

        const handleReplyClick = useCallback(
            (messageId: string): void => {
                const el = scrollerElRef.current;
                const node = el?.querySelector<HTMLElement>(
                    `[id="message-${CSS.escape(messageId)}"]`,
                );
                if (el && node) {
                    pinnedRef.current = false;
                    springTo(
                        Math.max(
                            0,
                            node.offsetTop -
                                el.clientHeight / 2 +
                                node.offsetHeight / 2,
                        ),
                    );
                    startTransitionHighlight((): void => {
                        setInternalHighlightId(messageId);
                    });
                }
                onReplyClickRef.current?.(messageId);
            },
            [springTo],
        );


        const renderItem = (item: VirtualItemData): React.ReactNode => {
            if (item.type === 'channel-start') {
                return (
                    <Box className="min-h-56">
                        <ChannelStartHeader
                            channel={selectedChannel}
                            friendUser={friendUser}
                        />
                    </Box>
                );
            }

            if (item.type === 'loader-older') {
                return (
                    <Box className="flex h-14 items-center justify-center">
                        {isLoadingMore ? (
                            <LoadingSpinner size="sm" />
                        ) : (
                            <Button
                                className="text-foreground-muted border-none bg-transparent text-xs shadow-none transition-colors hover:bg-bg-subtle hover:text-foreground"
                                size="sm"
                                variant="ghost"
                                onClick={onLoadMore}
                            >
                                Load older messages
                            </Button>
                        )}
                    </Box>
                );
            }

            if (item.type === 'date-separator') {
                return (
                    <Box className="px-4 py-2">
                        <Divider
                            text={formatDateSeparator(item.date)}
                            variant="line"
                        />
                    </Box>
                );
            }

            if (item.type === 'message') {
                return (
                    <MessageItem
                        disableColors={disableColors}
                        disableCustomFonts={disableCustomFonts}
                        disableGlow={disableGlow}
                        disableGlowAndColors={disableGlowAndColors}
                        discardMessage={discardMessage}
                        fullMemberMap={fullMemberMap}
                        hasPermission={hasPermission}
                        iconRole={item.message.iconRole}
                        isHighlighted={highlightId === item.message.id}
                        isOwner={isOwner}
                        me={me}
                        message={item.message}
                        prevMessage={item.prevMessage}
                        retryMessage={retryMessage}
                        role={item.message.role}
                        roleMap={roleMap}
                        senderMember={fullMemberMap?.get(item.message.senderId)}
                        senderRoles={userRolesMap?.get(item.message.senderId)}
                        serverDetails={serverDetails}
                        onReplyClick={handleReplyClick}
                        onReplyToMessage={onReplyToMessage}
                    />
                );
            }

            if (item.type === 'blocked-group') {
                return (
                    <Box className="my-1 px-4 py-2">
                        <Box
                            className="text-foreground-muted flex cursor-pointer items-center gap-2 text-xs font-medium transition-colors hover:text-foreground"
                            onClick={(): void => {
                                toggleGroup(item.id);
                            }}
                        >
                            {expandedGroups.has(item.id) ? (
                                <ChevronDown size={14} />
                            ) : (
                                <ChevronRight size={14} />
                            )}
                            <Text>
                                {item.messages.length === 1
                                    ? `1 message from blocked user`
                                    : `${item.messages.length} messages from blocked users`}
                            </Text>
                        </Box>
                        {expandedGroups.has(item.id) ? (
                            <Box className="mt-2 ml-1.5 border-l border-white/5 pl-2">
                                {item.messages.map(
                                    (msg, mIdx): React.ReactNode => (
                                        <MessageItem
                                            disableColors={disableColors}
                                            disableCustomFonts={
                                                disableCustomFonts
                                            }
                                            disableGlow={disableGlow}
                                            disableGlowAndColors={
                                                disableGlowAndColors
                                            }
                                            fullMemberMap={fullMemberMap}
                                            hasPermission={hasPermission}
                                            iconRole={msg.iconRole}
                                            isHighlighted={
                                                highlightId === msg.id
                                            }
                                            isOwner={isOwner}
                                            key={msg.id}
                                            me={me}
                                            message={msg}
                                            prevMessage={
                                                mIdx > 0
                                                    ? item.messages[mIdx - 1]
                                                    : undefined
                                            }
                                            role={msg.role}
                                            roleMap={roleMap}
                                            senderMember={fullMemberMap?.get(
                                                msg.senderId,
                                            )}
                                            senderRoles={userRolesMap?.get(
                                                msg.senderId,
                                            )}
                                            serverDetails={serverDetails}
                                            onReplyClick={handleReplyClick}
                                            onReplyToMessage={onReplyToMessage}
                                        />
                                    ),
                                )}
                            </Box>
                        ) : null}
                    </Box>
                );
            }

            if (item.type === 'loader-newer') {
                return (
                    <Box className="flex h-14 items-center justify-center">
                        {isLoadingMoreNewer ? (
                            <LoadingSpinner size="sm" />
                        ) : (
                            <Button
                                className="text-foreground-muted border-none bg-transparent text-xs shadow-none transition-colors hover:bg-bg-subtle hover:text-foreground"
                                size="sm"
                                variant="ghost"
                                onClick={onLoadMoreNewer}
                            >
                                Load newer messages
                            </Button>
                        )}
                    </Box>
                );
            }

            return null;
        };

        return (
            <Box className="relative flex min-h-0 flex-1 flex-col">
                <div
                    className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pt-4"
                    data-testid="messages-scroller"
                    ref={scrollerElRef}
                    style={{
                        overflowAnchor: 'none',
                        opacity: hasSettled ? 1 : 0,
                    }}
                    onScroll={handleScroll}
                >
                    {isReady
                        ? items.map(
                              (item): React.ReactNode => (
                                  <div key={itemKey(item)}>
                                      {renderItem(item)}
                                  </div>
                              ),
                          )
                        : null}
                    <VerticalSpacer verticalSpace={22} />
                </div>
                {hasSettled ? null : (
                    <Box className="pointer-events-none absolute inset-0 overflow-hidden">
                        <ChatSkeleton />
                    </Box>
                )}
            </Box>
        );
    },
);

MessagesList.displayName = 'MessagesList';
