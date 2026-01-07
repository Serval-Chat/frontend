import React from 'react';

import type { ChatMessage } from '@/api/chat/chat.types';
import { shouldGroupMessages } from '@/utils/timestamp';

import { Message } from './Message';

interface MessageItemProps {
    message: ChatMessage;
    prevMessage?: ChatMessage;
    isHighlighted?: boolean;
    onReplyClick?: (messageId: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
    message,
    prevMessage,
    isHighlighted,
    onReplyClick,
}) => {
    const isGroupStart =
        !prevMessage ||
        !!message.replyTo ||
        !shouldGroupMessages(prevMessage, message);

    return (
        <Message
            message={message}
            user={message.user}
            isGroupStart={isGroupStart}
            isHighlighted={isHighlighted}
            onReplyClick={onReplyClick}
        />
    );
};
