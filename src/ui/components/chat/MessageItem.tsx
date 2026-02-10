import React from 'react';

import type { Role } from '@/api/servers/servers.types';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { shouldGroupMessages } from '@/utils/timestamp';

import { Message } from './Message';

interface MessageItemProps {
    message: ProcessedChatMessage;
    role?: Role;
    iconRole?: Role;
    prevMessage?: ProcessedChatMessage;
    isHighlighted?: boolean;
    onReplyClick?: (messageId: string) => void;
    disableCustomFonts?: boolean;
    disableGlow?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
    message,
    role,
    iconRole,
    prevMessage,
    isHighlighted,
    onReplyClick,
    disableCustomFonts,
    disableGlow,
}) => {
    const isGroupStart =
        !prevMessage ||
        !!message.replyTo ||
        !shouldGroupMessages(prevMessage, message);

    return (
        <Message
            disableCustomFonts={disableCustomFonts}
            disableGlow={disableGlow}
            iconRole={iconRole || message.iconRole}
            isGroupStart={isGroupStart}
            isHighlighted={isHighlighted}
            message={message}
            role={role || message.role}
            user={message.user}
            onReplyClick={onReplyClick}
        />
    );
};
