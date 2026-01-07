import React, { useEffect, useRef } from 'react';

import type { ChatMessage } from '@/api/chat/chat.types';
import { VerticalSpacer } from '@/ui/components/layout/VerticalSpacer';

import { MessageItem } from './MessageItem';

interface MessagesListProps {
    messages: ChatMessage[];
    scrollToId?: string | null;
    onReplyClick?: (messageId: string) => void;
}

export const MessagesList: React.FC<MessagesListProps> = ({
    messages,
    scrollToId,
    onReplyClick,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [internalHighlightId, setInternalHighlightId] = React.useState<
        string | null
    >(null);

    const activeHighlightId = scrollToId || internalHighlightId;

    const handleReplyClick = (messageId: string) => {
        setInternalHighlightId(messageId);
        // Clear highlight after animation
        setTimeout(() => setInternalHighlightId(null), 2000);

        // Call external handler if provided
        onReplyClick?.(messageId);
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    // Handle explicit scroll requests (navigation)
    useEffect(() => {
        if (activeHighlightId) {
            const el = document.getElementById(`message-${activeHighlightId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [activeHighlightId]);

    useEffect(() => {
        // Only auto-scroll to bottom if we are NOT navigating to a specific message
        if (!activeHighlightId) {
            scrollToBottom();
            const timeout = setTimeout(scrollToBottom, 100);
            return () => clearTimeout(timeout);
        }
    }, [messages, activeHighlightId]);

    return (
        <div
            ref={scrollRef}
            className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar"
        >
            {messages.map((msg, index) => (
                <MessageItem
                    key={msg._id}
                    message={msg}
                    prevMessage={index > 0 ? messages[index - 1] : undefined}
                    isHighlighted={msg._id === activeHighlightId}
                    onReplyClick={handleReplyClick}
                />
            ))}
            {/* Scroll anchor / spacer */}
            <VerticalSpacer verticalSpace={16} />
        </div>
    );
};
