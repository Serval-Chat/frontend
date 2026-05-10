import React from 'react';

import type { Role } from '@/api/servers/servers.types';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { Message } from '@/ui/components/chat/Message';
import { shouldGroupMessages } from '@/utils/timestamp';

interface MessageItemProps {
    message: ProcessedChatMessage;
    role?: Role;
    iconRole?: Role;
    prevMessage?: ProcessedChatMessage;
    isHighlighted?: boolean;
    onReplyClick?: (messageId: string) => void;
    onReplyToMessage?: (message: ProcessedChatMessage) => void;
    disableCustomFonts?: boolean;
    disableGlowAndColors?: boolean;
    disableColors?: boolean;
    disableGlow?: boolean;
}

export const MessageItem = React.memo(
    ({
        message,
        role,
        iconRole,
        prevMessage,
        isHighlighted,
        onReplyClick,
        onReplyToMessage,
        disableCustomFonts,
        disableGlowAndColors,
        disableColors,
        disableGlow,
    }: MessageItemProps) => {
        const isGroupStart =
            !prevMessage ||
            !!message.replyTo ||
            !!message.replyToId ||
            !!message.repliedToMessageId ||
            !!message.interaction?.user ||
            !shouldGroupMessages(prevMessage, message);

        return (
            <Message
                disableColors={disableColors}
                disableCustomFonts={disableCustomFonts}
                disableGlow={disableGlow}
                disableGlowAndColors={disableGlowAndColors}
                iconRole={iconRole || message.iconRole}
                isGroupStart={isGroupStart}
                isHighlighted={isHighlighted}
                message={message}
                role={role || message.role}
                user={message.user}
                onReplyClick={onReplyClick}
                onReplyToMessage={onReplyToMessage}
            />
        );
    },
);

MessageItem.displayName = 'MessageItem';
