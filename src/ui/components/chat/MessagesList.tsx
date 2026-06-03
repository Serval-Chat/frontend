import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    useTransition,
} from 'react';

import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown, ChevronRight } from 'lucide-react';

import type {
    Role,
    RolePermissions,
    Server,
    ServerMember,
} from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { useAppDispatch } from '@/store/hooks';
import { useAppSelector } from '@/store/hooks';
import { setTargetMessageId } from '@/store/slices/navSlice';
import { BlockFlags } from '@/types/blocks';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { MessageItem } from '@/ui/components/chat/MessageItem';
import { Button } from '@/ui/components/common/Button';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { VerticalSpacer } from '@/ui/components/layout/VerticalSpacer';

import { ChatSkeleton } from './ChatSkeleton';

interface MessagesListProps {
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
    activeHighlightId?: string | null;
    disableCustomFonts?: boolean;
    disableGlowAndColors?: boolean;
    disableColors?: boolean;
    disableGlow?: boolean;
    me?: User;
    serverDetails?: Server;
    hasPermission?: (permission: keyof RolePermissions) => boolean;
    isOwner?: boolean;
    fullMemberMap?: Map<string, ServerMember>;
    userRolesMap?: Map<string, Role[]>;
    roleMap?: Map<string, Role>;
}

export const MessagesList = React.memo(
    ({
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
        activeHighlightId,
        disableCustomFonts,
        disableGlowAndColors,
        disableColors,
        disableGlow,
        me,
        serverDetails,
        hasPermission,
        isOwner,
        fullMemberMap,
        userRolesMap,
        roleMap,
    }: MessagesListProps) => {
        const dispatch = useAppDispatch();
        const blocks = useAppSelector(
            (state): Record<string, number> => state.blocking.blocks,
        );
        const scrollContainerRef = useRef<HTMLDivElement>(null);
        const [isAtBottom, setIsAtBottom] = useState(true);
        const lastScrollHeightRef = useRef<number>(0);
        const isPrependingScrollRef = useRef(false);
        const loadMoreCooldownRef = useRef(false);
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
            if (!isLoadingMore) {
                const t = setTimeout((): void => {
                    loadMoreCooldownRef.current = false;
                }, 100);
                return (): void => clearTimeout(t);
            }
        }, [isLoadingMore]);

        const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
            new Set(),
        );
        const isAtBottomRef = useRef(isAtBottom);

        type VirtualItemData =
            | { type: 'message'; message: ProcessedChatMessage }
            | {
                  type: 'blocked-group';
                  messages: ProcessedChatMessage[];
                  id: string;
              }
            | { type: 'loader-older' }
            | { type: 'loader-newer' }
            | { type: 'spacer' };

        const virtualItems = useMemo((): VirtualItemData[] => {
            const items: VirtualItemData[] = [];

            if (hasMore) {
                items.push({ type: 'loader-older' });
            }

            let currentBlockedGroup: ProcessedChatMessage[] = [];

            const flushBlockedGroup = (): void => {
                if (currentBlockedGroup.length === 0) return;
                items.push({
                    type: 'blocked-group',
                    messages: [...currentBlockedGroup],
                    id: `blocked-${currentBlockedGroup[0].id}`,
                });
                currentBlockedGroup = [];
            };

            messages.forEach((msg): void => {
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
                    items.push({ type: 'message', message: msg });
                }
            });

            flushBlockedGroup();

            if (hasMoreNewer) {
                items.push({ type: 'loader-newer' });
            }

            items.push({ type: 'spacer' });

            return items;
        }, [messages, blocks, hasMore, hasMoreNewer]);

        const [, startTransitionGroup] = useTransition();
        const virtualItemsRef = useRef(virtualItems);
        const didApplyInitialScrollRef = useRef(false);
        useLayoutEffect((): void => {
            virtualItemsRef.current = virtualItems;
        }, [virtualItems]);

        const scrollToFn = useCallback(
            (
                offset: number,
                options: { behavior?: ScrollBehavior; adjustments?: number },
            ): void => {
                const container = scrollContainerRef.current;
                if (!container) return;
                const toOffset = offset + (options.adjustments ?? 0);
                if (options.adjustments !== undefined) {
                    isPrependingScrollRef.current = true;
                    container.scrollTop = toOffset;
                    requestAnimationFrame((): void => {
                        isPrependingScrollRef.current = false;
                    });
                } else if (options.behavior === 'smooth') {
                    container.scrollTo({ top: toOffset, behavior: 'smooth' });
                } else {
                    container.scrollTop = toOffset;
                }
            },
            [],
        );

        // eslint-disable-next-line react-hooks/incompatible-library
        const rowVirtualizer = useVirtualizer({
            count: virtualItems.length,
            getScrollElement: (): HTMLDivElement | null =>
                scrollContainerRef.current,
            scrollToFn,
            estimateSize: useCallback((index: number): number => {
                const item = virtualItemsRef.current[index];
                if (!item) return 100;
                if (
                    item.type === 'loader-older' ||
                    item.type === 'loader-newer'
                )
                    return 60;
                if (item.type === 'spacer') return 22;
                if (item.type === 'blocked-group') return 40;

                if (item.type === 'message') {
                    let estimated = 100;

                    if (item.message.text) {
                        estimated +=
                            Math.floor(item.message.text.length / 50) * 20;
                    }
                    if (item.message.embeds?.length) {
                        estimated += item.message.embeds.length * 350;
                    }
                    if (item.message.attachments?.length) {
                        estimated += item.message.attachments.length * 400;
                    }
                    if (item.message.poll) {
                        estimated +=
                            150 + item.message.poll.options.length * 40;
                    }

                    return Math.min(estimated, 2000);
                }

                return 100;
            }, []),
            getItemKey: useCallback(
                (index: number): string | number => {
                    const item = virtualItems[index];
                    if (!item) return index;
                    if (item.type === 'message') return item.message.id;
                    if (item.type === 'blocked-group') return item.id;
                    return item.type;
                },
                [virtualItems],
            ),
            initialOffset: (): number =>
                activeHighlightId ? 0 : Number.MAX_SAFE_INTEGER,
            overscan: 10,
        });
        const measureFrameRef = useRef<number | null>(null);
        const requestMeasure = useCallback((): void => {
            if (measureFrameRef.current !== null) return;

            measureFrameRef.current = requestAnimationFrame((): void => {
                measureFrameRef.current = null;

                const container = scrollContainerRef.current;
                if (container && isAtBottomRef.current) {
                    rowVirtualizer.scrollToIndex(
                        virtualItemsRef.current.length - 1,
                        {
                            align: 'end',
                        },
                    );
                }
            });
        }, [rowVirtualizer]);

        useEffect(
            (): (() => void) => (): void => {
                if (measureFrameRef.current !== null) {
                    cancelAnimationFrame(measureFrameRef.current);
                }
            },
            [],
        );
        const toggleGroup = useCallback((groupId: string): void => {
            startTransitionGroup((): void => {
                setExpandedGroups((prev): Set<string> => {
                    const next = new Set(prev);
                    if (next.has(groupId)) {
                        next.delete(groupId);
                    } else {
                        next.add(groupId);
                    }
                    return next;
                });
            });
        }, []);

        const onReplyClickRef = useRef(onReplyClick);
        useLayoutEffect((): void => {
            onReplyClickRef.current = onReplyClick;
        });

        const handleReplyClick = useCallback(
            (messageId: string): void => {
                const index = virtualItemsRef.current.findIndex(
                    (item): boolean =>
                        item.type === 'message' &&
                        item.message.id === messageId,
                );
                if (index !== -1) {
                    rowVirtualizer.scrollToIndex(index, {
                        align: 'center',
                        behavior: 'smooth',
                    });
                    startTransitionHighlight((): void => {
                        setInternalHighlightId(messageId);
                    });
                }

                onReplyClickRef.current?.(messageId);
            },
            [rowVirtualizer],
        );

        const handleScroll = useCallback((): void => {
            const container = scrollContainerRef.current;
            if (!container || isPrependingScrollRef.current) return;

            const { scrollTop, scrollHeight, clientHeight } = container;
            const nextIsAtBottom = scrollHeight - scrollTop - clientHeight < 5;
            if (isAtBottomRef.current !== nextIsAtBottom) {
                isAtBottomRef.current = nextIsAtBottom;
                setIsAtBottom(nextIsAtBottom);
            }

            if (scrollTop > 500) {
                loadMoreCooldownRef.current = false;
            }

            if (
                scrollTop < 200 &&
                hasMore &&
                !isLoadingMore &&
                !loadMoreCooldownRef.current
            ) {
                loadMoreCooldownRef.current = true;
                onLoadMore?.();
            }
        }, [hasMore, isLoadingMore, onLoadMore]);

        useEffect((): void => {
            const container = scrollContainerRef.current;
            if (!container) return;

            if (
                container.scrollTop < 200 &&
                hasMore &&
                !isLoadingMore &&
                !loadMoreCooldownRef.current
            ) {
                loadMoreCooldownRef.current = true;
                onLoadMore?.();
            }
        }, [messages, hasMore, isLoadingMore, onLoadMore]);

        const totalSize = rowVirtualizer.getTotalSize();

        const prevFirstMessageIdRef = useRef<string | null>(null);
        const prevLastItemKeyRef = useRef<string | number | null>(null);

        useLayoutEffect((): void => {
            const container = scrollContainerRef.current;
            if (!container || virtualItems.length === 0) return;

            const firstMessage = virtualItems.find(
                (item): boolean => item.type === 'message',
            ) as { message: { id: string } } | undefined;
            const firstMessageId = firstMessage?.message.id ?? null;
            const isPrepending =
                prevFirstMessageIdRef.current !== null &&
                firstMessageId !== null &&
                firstMessageId !== prevFirstMessageIdRef.current;

            prevFirstMessageIdRef.current = firstMessageId;

            const lastItem =
                [...virtualItems]
                    .reverse()
                    .find((item): boolean => item.type !== 'spacer') ??
                virtualItems[virtualItems.length - 1];
            const lastItemKey =
                lastItem.type === 'message'
                    ? lastItem.message.id
                    : lastItem.type === 'blocked-group'
                      ? lastItem.id
                      : lastItem.type;
            const newScrollHeight = container.scrollHeight;

            if (isPrepending && lastScrollHeightRef.current !== 0) {
                const heightDiff =
                    newScrollHeight - lastScrollHeightRef.current;
                if (heightDiff > 0) {
                    isPrependingScrollRef.current = true;
                    container.scrollTop += heightDiff;
                    requestAnimationFrame((): void => {
                        isPrependingScrollRef.current = false;
                    });
                }
                lastScrollHeightRef.current = newScrollHeight;
                return;
            }

            if (isAtBottom) {
                if (!didApplyInitialScrollRef.current) {
                    didApplyInitialScrollRef.current = true;
                    isAtBottomRef.current = true;
                    lastScrollHeightRef.current = newScrollHeight;
                    prevLastItemKeyRef.current = lastItemKey;
                    return;
                }

                if (prevLastItemKeyRef.current === lastItemKey) {
                    lastScrollHeightRef.current = newScrollHeight;
                    return;
                }

                rowVirtualizer.scrollToIndex(virtualItems.length - 1, {
                    align: 'end',
                });
                isAtBottomRef.current = true;
                lastScrollHeightRef.current = newScrollHeight;
                prevLastItemKeyRef.current = lastItemKey;
                return;
            }

            lastScrollHeightRef.current = newScrollHeight;
            prevLastItemKeyRef.current = lastItemKey;
        }, [virtualItems, totalSize, isAtBottom, rowVirtualizer]);

        const lastScrolledIdRef = useRef<string | null>(null);

        useEffect((): void => {
            if (!activeHighlightId) {
                lastScrolledIdRef.current = null;
                return;
            }

            if (lastScrolledIdRef.current === activeHighlightId) {
                return;
            }

            const index = virtualItems.findIndex(
                (item): boolean =>
                    item.type === 'message' &&
                    item.message.id === activeHighlightId,
            );
            if (index !== -1) {
                rowVirtualizer.scrollToIndex(index, { align: 'center' });
                lastScrolledIdRef.current = activeHighlightId;
            }
        }, [activeHighlightId, virtualItems, rowVirtualizer]);

        useEffect((): (() => void) | undefined => {
            if (!highlightId) return;

            const timer = setTimeout((): void => {
                setInternalHighlightId(null);
                dispatch(setTargetMessageId(null));
            }, 2000);

            return (): void => {
                clearTimeout(timer);
            };
        }, [highlightId, dispatch]);

        useEffect(
            (): (() => void) => (): void => {
                if (activeHighlightId) {
                    dispatch(setTargetMessageId(null));
                }
            },
            [activeHighlightId, dispatch],
        );

        return (
            <Box
                className="custom-scrollbar relative flex min-h-0 flex-1 flex-col overflow-y-auto pt-4"
                ref={scrollContainerRef}
                style={{ overflowAnchor: 'none' }}
                onScroll={handleScroll}
            >
                {isLoading ? (
                    <ChatSkeleton />
                ) : (
                    <Box
                        className="relative w-full"
                        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const item = virtualItems[virtualRow.index];
                            return (
                                <div
                                    data-index={virtualRow.index}
                                    key={virtualRow.key}
                                    ref={rowVirtualizer.measureElement}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    {item.type === 'loader-older' && (
                                        <Box className="flex justify-center py-4">
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
                                    )}

                                    {item.type === 'message' && (
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
                                            iconRole={item.message.iconRole}
                                            isHighlighted={
                                                highlightId === item.message.id
                                            }
                                            isOwner={isOwner}
                                            me={me}
                                            message={item.message}
                                            prevMessage={
                                                virtualRow.index > 0 &&
                                                virtualItems[
                                                    virtualRow.index - 1
                                                ].type === 'message'
                                                    ? (
                                                          virtualItems[
                                                              virtualRow.index -
                                                                  1
                                                          ] as {
                                                              message: ProcessedChatMessage;
                                                          }
                                                      ).message
                                                    : undefined
                                            }
                                            role={item.message.role}
                                            roleMap={roleMap}
                                            senderMember={fullMemberMap?.get(
                                                item.message.senderId,
                                            )}
                                            senderRoles={userRolesMap?.get(
                                                item.message.senderId,
                                            )}
                                            serverDetails={serverDetails}
                                            onReplyClick={handleReplyClick}
                                            onReplyToMessage={onReplyToMessage}
                                            onResize={requestMeasure}
                                        />
                                    )}

                                    {item.type === 'blocked-group' && (
                                        <Box className="my-1 px-4 py-2">
                                            <Box
                                                className="text-foreground-muted flex cursor-pointer items-center gap-2 text-xs font-medium transition-colors hover:text-foreground"
                                                onClick={(): void =>
                                                    toggleGroup(item.id)
                                                }
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
                                            {expandedGroups.has(item.id) && (
                                                <Box className="mt-2 ml-1.5 border-l border-white/5 pl-2">
                                                    {item.messages.map(
                                                        (msg, mIdx) => (
                                                            <MessageItem
                                                                disableColors={
                                                                    disableColors
                                                                }
                                                                disableCustomFonts={
                                                                    disableCustomFonts
                                                                }
                                                                disableGlow={
                                                                    disableGlow
                                                                }
                                                                disableGlowAndColors={
                                                                    disableGlowAndColors
                                                                }
                                                                fullMemberMap={
                                                                    fullMemberMap
                                                                }
                                                                hasPermission={
                                                                    hasPermission
                                                                }
                                                                iconRole={
                                                                    msg.iconRole
                                                                }
                                                                isHighlighted={
                                                                    highlightId ===
                                                                    msg.id
                                                                }
                                                                isOwner={
                                                                    isOwner
                                                                }
                                                                key={msg.id}
                                                                me={me}
                                                                message={msg}
                                                                prevMessage={
                                                                    mIdx > 0
                                                                        ? item
                                                                              .messages[
                                                                              mIdx -
                                                                                  1
                                                                          ]
                                                                        : undefined
                                                                }
                                                                role={msg.role}
                                                                roleMap={
                                                                    roleMap
                                                                }
                                                                senderMember={fullMemberMap?.get(
                                                                    msg.senderId,
                                                                )}
                                                                senderRoles={userRolesMap?.get(
                                                                    msg.senderId,
                                                                )}
                                                                serverDetails={
                                                                    serverDetails
                                                                }
                                                                onReplyClick={
                                                                    handleReplyClick
                                                                }
                                                                onReplyToMessage={
                                                                    onReplyToMessage
                                                                }
                                                                onResize={
                                                                    requestMeasure
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    )}

                                    {item.type === 'loader-newer' && (
                                        <Box className="flex justify-center py-4">
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
                                    )}

                                    {item.type === 'spacer' && (
                                        <VerticalSpacer verticalSpace={22} />
                                    )}
                                </div>
                            );
                        })}
                    </Box>
                )}
            </Box>
        );
    },
);

MessagesList.displayName = 'MessagesList';
