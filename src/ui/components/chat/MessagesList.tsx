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
    onReplyClick?: (messageId: string) => void;
    activeHighlightId?: string | null;
    disableCustomFonts?: boolean;
}

/**
 * @description List of messages with scroll management and loading more functionality.
 */
export const MessagesList: React.FC<MessagesListProps> = ({
    messages,
    onLoadMore,
    hasMore,
    isLoadingMore,
    onReplyClick,
    activeHighlightId,
    disableCustomFonts,
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const lastScrollHeightRef = useRef<number>(0);
    const [highlightId, setInternalHighlightId] = useState<string | null>(
        activeHighlightId || null,
    );

    const handleReplyClick = (messageId: string): void => {
        setInternalHighlightId(messageId);
        // Clear highlight after animation
        setTimeout(() => setInternalHighlightId(null), 2000);

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

    // Handle explicit scroll requests
    useEffect(() => {
        if (!activeHighlightId) return;

        const el = document.getElementById(`message-${activeHighlightId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        const highlightTimeout = setTimeout(() => {
            setInternalHighlightId(activeHighlightId);
        }, 0);

        const clearHighlightTimeout = setTimeout(() => {
            setInternalHighlightId(null);
        }, 2000);

        return () => {
            clearTimeout(highlightTimeout);
            clearTimeout(clearHighlightTimeout);
        };
    }, [activeHighlightId]);

    return (
        <Box
            className="flex-1 overflow-y-auto min-h-0 relative custom-scrollbar flex flex-col pt-4"
            ref={scrollContainerRef}
            onScroll={handleScroll}
        >
            {hasMore && (
                <Box className="flex justify-center py-4">
                    {isLoadingMore ? (
                        <LoadingSpinner size="sm" />
                    ) : (
                        <Button
                            className="bg-transparent border-none shadow-none text-xs text-foreground-muted hover:text-foreground hover:bg-bg-subtle transition-colors"
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
                    disableCustomFonts={disableCustomFonts}
                    iconRole={msg.iconRole}
                    isHighlighted={highlightId === msg._id}
                    key={msg._id}
                    message={msg}
                    prevMessage={index > 0 ? messages[index - 1] : undefined}
                    role={msg.role}
                    onReplyClick={handleReplyClick}
                />
            ))}
            <VerticalSpacer verticalSpace={20} />
        </Box>
    );
};
