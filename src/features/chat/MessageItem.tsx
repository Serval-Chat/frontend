import React from 'react';

import type {
    Role,
    RolePermissions,
    Server,
    ServerMember,
} from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { Message } from '@/features/chat/Message';
import type { QuickReactionEmoji } from '@/hooks/useFrequentlyUsedEmojis';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { shouldGroupMessages } from '@/utils/timestamp';

import type {
    MessageChannelData,
    MessagePermissionFlags,
} from './Message/Message.types';

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
    interactionMember?: ServerMember;
    mentionsMe?: boolean;
    currentUserHighestRolePosition?: number;
    localNickname?: string;
    isFriend?: boolean;
    isMobileLayout?: boolean;
    messagePermissions?: MessagePermissionFlags;
    quickReactions?: QuickReactionEmoji[];
    messageChannelData?: MessageChannelData;
    isOwner?: boolean;
    roleMap?: Map<string, Role>;
    onResize?: () => void;
    retryMessage?: (localId: string) => void;
    discardMessage?: (localId: string) => void;
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
        interactionMember,
        mentionsMe,
        currentUserHighestRolePosition,
        localNickname,
        isFriend,
        isMobileLayout,
        messagePermissions,
        quickReactions,
        messageChannelData,
        isOwner,
        roleMap,
        onResize,
        retryMessage,
        discardMessage,
    }: MessageItemProps) => {
        const permissionFlags: MessagePermissionFlags = React.useMemo(
            () => ({
                administrator: messagePermissions?.administrator,
                manageMessages: messagePermissions?.manageMessages,
                deleteMessagesOfOthers:
                    messagePermissions?.deleteMessagesOfOthers,
                pinMessages: messagePermissions?.pinMessages,
                banMembers: messagePermissions?.banMembers,
                kickMembers: messagePermissions?.kickMembers,
                moderateMembers: messagePermissions?.moderateMembers,
                manageRoles: messagePermissions?.manageRoles,
                manageReactions: messagePermissions?.manageReactions,
            }),
            [
                messagePermissions?.administrator,
                messagePermissions?.manageMessages,
                messagePermissions?.deleteMessagesOfOthers,
                messagePermissions?.pinMessages,
                messagePermissions?.banMembers,
                messagePermissions?.kickMembers,
                messagePermissions?.moderateMembers,
                messagePermissions?.manageRoles,
                messagePermissions?.manageReactions,
            ],
        );
        const hasPermission = React.useCallback(
            (permission: keyof RolePermissions): boolean =>
                permissionFlags[permission] ?? false,
            [permissionFlags],
        );

        const senderRoles = React.useMemo((): Role[] | undefined => {
            if (!senderMember || !roleMap?.size) return undefined;

            const roleIds = [...senderMember.roles];
            const everyoneRole = [...roleMap.values()].find(
                (candidate): boolean => candidate.name === '@everyone',
            );
            if (everyoneRole && !roleIds.includes(everyoneRole.id)) {
                roleIds.push(everyoneRole.id);
            }

            return roleIds
                .map((id): Role | undefined => roleMap.get(id))
                .filter((candidate): candidate is Role => !!candidate);
        }, [senderMember, roleMap]);

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
                currentUserHighestRolePosition={currentUserHighestRolePosition}
                disableColors={disableColors}
                disableCustomFonts={disableCustomFonts}
                disableGlow={disableGlow}
                disableGlowAndColors={disableGlowAndColors}
                discardMessage={discardMessage}
                hasPermission={hasPermission}
                iconRole={iconRole || message.iconRole}
                interactionMember={interactionMember}
                isFriend={isFriend}
                isGroupStart={isGroupStart}
                isHighlighted={isHighlighted}
                isMobileLayout={isMobileLayout}
                isOwner={isOwner}
                localNickname={localNickname}
                me={me}
                mentionsMe={mentionsMe}
                message={message}
                messageChannelData={messageChannelData}
                quickReactions={quickReactions}
                retryMessage={retryMessage}
                role={role || message.role}
                roleMap={roleMap}
                senderMember={senderMember}
                senderRoles={senderRoles}
                serverDetails={serverDetails}
                user={message.user}
                onReplyClick={onReplyClick}
                onReplyToMessage={onReplyToMessage}
                onResize={onResize}
            />
        );
    },
);

MessageItem.displayName = 'MessageItem';
