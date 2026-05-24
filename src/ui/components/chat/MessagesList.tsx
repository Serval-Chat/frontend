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

export const MessagesList: React.FC<MessagesListProps> = React.memo(
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
    }) => {
        const dispatch = useAppDispatch();
        const blocks = useAppSelector((state) => state.blocking.blocks);
        const scrollContainerRef = useRef<HTMLDivElement>(null);
        const [isAtBottom, setIsAtBottom] = useState(true);
        const lastScrollHeightRef = useRef<number>(0);
        const isPrependingScrollRef = useRef(false);
        const loadMoreCooldownRef = useRef(false);
        const [highlightId, setInternalHighlightId] = useState<string | null>(
            null,
        );

        const [, startTransitionHighlight] = useTransition();

        useEffect(() => {
            startTransitionHighlight(() => {
                setInternalHighlightId(activeHighlightId ?? null);
            });
        }, [activeHighlightId]);

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
                    id: `blocked-${currentBlockedGroup[0]._id}`,
                });
                currentBlockedGroup = [];
            };

            messages.forEach((msg) => {
                const senderBlocks = blocks[msg.senderId] || 0;
                const isSenderBlocked = !!(
                    senderBlocks & BlockFlags.HIDE_MESSAGES
                );

                const replyToSenderId = msg.replyTo?.user?._id;
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
        useLayoutEffect(() => {
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
                    requestAnimationFrame(() => {
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
            getScrollElement: () => scrollContainerRef.current,
            scrollToFn,
            estimateSize: useCallback((index: number) => {
                const item = virtualItemsRef.current[index];
                if (
                    item?.type === 'loader-older' ||
                    item?.type === 'loader-newer'
                )
                    return 60;
                if (item?.type === 'spacer') return 22;
                if (item?.type === 'blocked-group') return 40;
                return 100;
            }, []),
            getItemKey: useCallback(
                (index: number) => {
                    const item = virtualItems[index];
                    if (!item) return index;
                    if (item.type === 'message') return item.message._id;
                    if (item.type === 'blocked-group') return item.id;
                    return item.type;
                },
                [virtualItems],
            ),
            overscan: 10,
        });
        const toggleGroup = useCallback((groupId: string): void => {
            startTransitionGroup(() => {
                setExpandedGroups((prev) => {
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
        useLayoutEffect(() => {
            onReplyClickRef.current = onReplyClick;
        });

        const handleReplyClick = useCallback(
            (messageId: string): void => {
                const index = virtualItemsRef.current.findIndex(
                    (item) =>
                        item.type === 'message' &&
                        item.message._id === messageId,
                );
                if (index !== -1) {
                    rowVirtualizer.scrollToIndex(index, {
                        align: 'center',
                        behavior: 'smooth',
                    });
                    startTransitionHighlight(() => {
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
        useLayoutEffect(() => {
            const container = scrollContainerRef.current;
            if (!container || virtualItems.length === 0) return;

            if (isAtBottom) {
                rowVirtualizer.scrollToIndex(virtualItems.length - 1, {
                    align: 'end',
                });
                isAtBottomRef.current = true;
                lastScrollHeightRef.current = container.scrollHeight;
                return;
            }

            const newScrollHeight = container.scrollHeight;
            if (lastScrollHeightRef.current !== 0) {
                const heightDiff =
                    newScrollHeight - lastScrollHeightRef.current;
                if (heightDiff > 0) {
                    isPrependingScrollRef.current = true;
                    container.scrollTop += heightDiff;
                    requestAnimationFrame(() => {
                        isPrependingScrollRef.current = false;
                    });
                }
            }

            lastScrollHeightRef.current = newScrollHeight;
        }, [virtualItems, isAtBottom, rowVirtualizer]);

        const lastScrolledIdRef = useRef<string | null>(null);

        useEffect(() => {
            if (!activeHighlightId) {
                lastScrolledIdRef.current = null;
                return;
            }

            if (lastScrolledIdRef.current === activeHighlightId) {
                return;
            }

            const index = virtualItems.findIndex(
                (item) =>
                    item.type === 'message' &&
                    item.message._id === activeHighlightId,
            );
            if (index !== -1) {
                rowVirtualizer.scrollToIndex(index, { align: 'center' });
                lastScrolledIdRef.current = activeHighlightId;
            }
        }, [activeHighlightId, virtualItems, rowVirtualizer]);

        useEffect(() => {
            if (!highlightId) return;

            const timer = setTimeout(() => {
                setInternalHighlightId(null);
                dispatch(setTargetMessageId(null));
            }, 2000);

            return () => {
                clearTimeout(timer);
            };
        }, [highlightId, dispatch]);

        useEffect(
            () => () => {
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
                style={{ overflowAnchor: 'auto' }}
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
                                                highlightId === item.message._id
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
                                        />
                                    )}

                                    {item.type === 'blocked-group' && (
                                        <Box className="my-1 px-4 py-2">
                                            <Box
                                                className="text-foreground-muted flex cursor-pointer items-center gap-2 text-xs font-medium transition-colors hover:text-foreground"
                                                onClick={() =>
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
                                                                    msg._id
                                                                }
                                                                isOwner={
                                                                    isOwner
                                                                }
                                                                key={msg._id}
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
