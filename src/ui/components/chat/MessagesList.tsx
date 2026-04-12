import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { ChevronDown, ChevronRight } from 'lucide-react';

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

interface MessagesListProps {
    messages: ProcessedChatMessage[];
    onLoadMore?: () => void;
    hasMore?: boolean;
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
}

/**
 * @description List of messages with scroll management and loading more functionality.
 */
export const MessagesList: React.FC<MessagesListProps> = ({
    messages,
    onLoadMore,
    hasMore,
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
}) => {
    const dispatch = useAppDispatch();
    const blocks = useAppSelector((state) => state.blocking.blocks);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const lastScrollHeightRef = useRef<number>(0);
    const [highlightId, setInternalHighlightId] = useState<string | null>(null);
    const [prevActiveHighlightId, setPrevActiveHighlightId] = useState<
        string | null
    >(null);

    const normalizedHighlightId = activeHighlightId ?? null;
    if (normalizedHighlightId !== prevActiveHighlightId) {
        setPrevActiveHighlightId(normalizedHighlightId);
        setInternalHighlightId(normalizedHighlightId);
    }
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        new Set(),
    );

    const toggleGroup = (groupId: string): void => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }
            return next;
        });
    };

    const handleReplyClick = (messageId: string): void => {
        const el = document.getElementById(`message-${messageId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setInternalHighlightId(messageId);
        }

        onReplyClick?.(messageId);
    };

    const handleScroll = (): void => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        const atBottom = scrollHeight - scrollTop - clientHeight < 5;
        setIsAtBottom(atBottom);

        // Trigger load more when reaching top
        if (scrollTop === 0 && hasMore && !isLoadingMore) {
            onLoadMore?.();
        }
    };

    // Use layout effect to preserve scroll position when new messages arrive at the top
    useLayoutEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || messages.length === 0) return;

        const newScrollHeight = container.scrollHeight;

        // If at bottom, stay at bottom
        if (isAtBottom) {
            container.scrollTop =
                container.scrollHeight - container.clientHeight;
            lastScrollHeightRef.current = container.scrollHeight;
            return;
        }

        // If messages were added at the top (pagination), preserve relative position
        if (lastScrollHeightRef.current !== 0 && messages.length > 0) {
            const heightDiff = newScrollHeight - lastScrollHeightRef.current;
            if (heightDiff > 0) {
                container.scrollTop += heightDiff;
            }
        }

        lastScrollHeightRef.current = newScrollHeight;
    }, [messages, activeHighlightId, isAtBottom]);

    const lastScrolledIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!activeHighlightId) {
            lastScrolledIdRef.current = null;
            return;
        }

        if (lastScrolledIdRef.current === activeHighlightId) {
            return;
        }

        const el = document.getElementById(`message-${activeHighlightId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            lastScrolledIdRef.current = activeHighlightId;
        }
    }, [activeHighlightId, messages]);

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
            {hasMore && (
                <Box
                    className="flex justify-center py-4"
                    style={{ overflowAnchor: 'none' }}
                >
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

            {(() => {
                const elements: React.ReactNode[] = [];
                let currentBlockedGroup: ProcessedChatMessage[] = [];

                const flushBlockedGroup = (): void => {
                    if (currentBlockedGroup.length === 0) return;
                    const group = [...currentBlockedGroup];
                    const groupId = `blocked-${group[0]._id}`;
                    const isExpanded = expandedGroups.has(groupId);

                    elements.push(
                        <Box className="my-1 px-4 py-2" key={groupId}>
                            <Box
                                className="text-foreground-muted flex cursor-pointer items-center gap-2 text-xs font-medium transition-colors hover:text-foreground"
                                onClick={() => toggleGroup(groupId)}
                            >
                                {isExpanded ? (
                                    <ChevronDown size={14} />
                                ) : (
                                    <ChevronRight size={14} />
                                )}
                                <Text>
                                    {group.length === 1
                                        ? `1 message from blocked user`
                                        : `${group.length} messages from blocked users`}
                                </Text>
                            </Box>
                            {isExpanded && (
                                <Box className="mt-2 ml-1.5 border-l border-white/5 pl-2">
                                    {group.map((msg) => {
                                        const originalIndex =
                                            messages.indexOf(msg);
                                        return (
                                            <MessageItem
                                                disableColors={disableColors}
                                                disableCustomFonts={
                                                    disableCustomFonts
                                                }
                                                disableGlow={disableGlow}
                                                disableGlowAndColors={
                                                    disableGlowAndColors
                                                }
                                                iconRole={msg.iconRole}
                                                isHighlighted={
                                                    highlightId === msg._id
                                                }
                                                key={msg._id}
                                                message={msg}
                                                prevMessage={
                                                    originalIndex > 0
                                                        ? messages[
                                                              originalIndex - 1
                                                          ]
                                                        : undefined
                                                }
                                                role={msg.role}
                                                onReplyClick={handleReplyClick}
                                                onReplyToMessage={
                                                    onReplyToMessage
                                                }
                                            />
                                        );
                                    })}
                                </Box>
                            )}
                        </Box>,
                    );
                    currentBlockedGroup = [];
                };

                messages.forEach((msg, index) => {
                    const senderBlocks = blocks[msg.senderId] || 0;
                    const isSenderBlocked = !!(
                        senderBlocks & BlockFlags.HIDE_MESSAGES
                    );

                    const replyToSenderId = msg.replyTo?.user?._id;
                    const isReplyToBlocked =
                        replyToSenderId &&
                        !!(
                            (blocks[replyToSenderId] || 0) &
                            BlockFlags.HIDE_REPLIES
                        );

                    if (isSenderBlocked || isReplyToBlocked) {
                        currentBlockedGroup.push(msg);
                    } else {
                        flushBlockedGroup();
                        elements.push(
                            <MessageItem
                                disableColors={disableColors}
                                disableCustomFonts={disableCustomFonts}
                                disableGlow={disableGlow}
                                disableGlowAndColors={disableGlowAndColors}
                                iconRole={msg.iconRole}
                                isHighlighted={highlightId === msg._id}
                                key={msg._id}
                                message={msg}
                                prevMessage={
                                    index > 0 ? messages[index - 1] : undefined
                                }
                                role={msg.role}
                                onReplyClick={handleReplyClick}
                                onReplyToMessage={onReplyToMessage}
                            />,
                        );
                    }
                });

                flushBlockedGroup();
                return elements;
            })()}

            {hasMoreNewer && (
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

            <VerticalSpacer verticalSpace={20} />
        </Box>
    );
};
