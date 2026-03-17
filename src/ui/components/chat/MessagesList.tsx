import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { ProcessedChatMessage } from '@/types/chat.ui';
import { MessageItem } from '@/ui/components/chat/MessageItem';
import { Button } from '@/ui/components/common/Button';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
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
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const lastScrollHeightRef = useRef<number>(0);
    const [highlightId, setInternalHighlightId] = useState<string | null>(
        activeHighlightId || null,
    );
    const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );

    const handleReplyClick = (messageId: string): void => {
        setInternalHighlightId(messageId);
        const el = document.getElementById(`message-${messageId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Clear highlight after animation
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = setTimeout(() => {
            setInternalHighlightId(null);
            highlightTimerRef.current = null;
        }, 2000);

        onReplyClick?.(messageId);
    };

    const handleScroll = (): void => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        const atBottom = scrollHeight - scrollTop - clientHeight < 50;
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
            container.scrollTop = newScrollHeight;
            lastScrollHeightRef.current = newScrollHeight;
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

    // Handle explicit scroll requests
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
            requestAnimationFrame(() => {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setInternalHighlightId(activeHighlightId);
            });
            lastScrolledIdRef.current = activeHighlightId;

            if (highlightTimerRef.current)
                clearTimeout(highlightTimerRef.current);
            highlightTimerRef.current = setTimeout(() => {
                setInternalHighlightId(null);
                highlightTimerRef.current = null;
            }, 2000);
        }
    }, [activeHighlightId, messages]);

    useEffect(
        () => () => {
            if (highlightTimerRef.current)
                clearTimeout(highlightTimerRef.current);
        },
        [],
    );

    return (
        <Box
            className="custom-scrollbar relative flex min-h-0 flex-1 flex-col overflow-y-auto pt-4"
            ref={scrollContainerRef}
            onScroll={handleScroll}
        >
            {hasMore && (
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

            {messages.map((msg, index) => (
                <MessageItem
                    disableColors={disableColors}
                    disableCustomFonts={disableCustomFonts}
                    disableGlow={disableGlow}
                    disableGlowAndColors={disableGlowAndColors}
                    iconRole={msg.iconRole}
                    isHighlighted={highlightId === msg._id}
                    key={msg._id}
                    message={msg}
                    prevMessage={index > 0 ? messages[index - 1] : undefined}
                    role={msg.role}
                    onReplyClick={handleReplyClick}
                    onReplyToMessage={onReplyToMessage}
                />
            ))}

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
