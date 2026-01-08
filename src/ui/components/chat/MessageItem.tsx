import React from 'react';

import type { Role } from '@/api/servers/servers.types';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { shouldGroupMessages } from '@/utils/timestamp';

import { Message } from './Message';

interface MessageItemProps {
    message: ProcessedChatMessage;
    role?: Role;
    prevMessage?: ProcessedChatMessage;
    isHighlighted?: boolean;
    onReplyClick?: (messageId: string) => void;
    disableCustomFonts?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
    message,
    role,
    prevMessage,
    isHighlighted,
    onReplyClick,
    disableCustomFonts,
}) => {
    const isGroupStart =
        !prevMessage ||
        !!message.replyTo ||
        !shouldGroupMessages(prevMessage, message);

    return (
        <Message
            message={message}
            user={message.user}
            role={role || message.role}
            isGroupStart={isGroupStart}
            isHighlighted={isHighlighted}
            onReplyClick={onReplyClick}
            disableCustomFonts={disableCustomFonts}
        />
    );
};
