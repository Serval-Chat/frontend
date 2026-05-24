import React from 'react';

import type {
    Role,
    RolePermissions,
    Server,
    ServerMember,
} from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
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
    me?: User;
    serverDetails?: Server;
    senderMember?: ServerMember;
    senderRoles?: Role[];
    hasPermission?: (permission: keyof RolePermissions) => boolean;
    isOwner?: boolean;
    fullMemberMap?: Map<string, ServerMember>;
    roleMap?: Map<string, Role>;
}

export const MessageItem = React.memo(
    ({
        message,
        role,
        iconRole,
        prevMessage,
        isHighlighted = false,
        onReplyClick,
        onReplyToMessage,
        disableCustomFonts,
        disableGlowAndColors,
        disableColors,
        disableGlow,
        me,
        serverDetails,
        senderMember,
        senderRoles,
        hasPermission,
        isOwner,
        fullMemberMap,
        roleMap,
    }: MessageItemProps) => {
        const isGroupStart =
            !prevMessage ||
            !!message.replyTo ||
            !!message.replyToId ||
            !!message.repliedToMessageId ||
            (!!message.interaction?.command?.trim() &&
                !!message.interaction.user) ||
            !shouldGroupMessages(prevMessage, message);

        return (
            <Message
                disableColors={disableColors}
                disableCustomFonts={disableCustomFonts}
                disableGlow={disableGlow}
                disableGlowAndColors={disableGlowAndColors}
                fullMemberMap={fullMemberMap}
                hasPermission={hasPermission}
                iconRole={iconRole || message.iconRole}
                isGroupStart={isGroupStart}
                isHighlighted={isHighlighted}
                isOwner={isOwner}
                me={me}
                message={message}
                role={role || message.role}
                roleMap={roleMap}
                senderMember={senderMember}
                senderRoles={senderRoles}
                serverDetails={serverDetails}
                user={message.user}
                onReplyClick={onReplyClick}
                onReplyToMessage={onReplyToMessage}
            />
        );
    },
);

MessageItem.displayName = 'MessageItem';
