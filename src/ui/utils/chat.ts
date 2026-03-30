import type { ChatMessage } from '@/api/chat/chat.types';
import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import type { ProcessedChatMessage } from '@/types/chat.ui';

/**
 * Finds the highest role for a member based on position.
 */
export const getHighestRoleForMember = (
    roleIds: string[] | undefined,
    roleMap: Map<string, Role>,
): Role | undefined => {
    if (!roleIds || roleIds.length === 0) return undefined;

    let highestRole: Role | undefined = undefined;
    roleIds.forEach((roleId) => {
        const role = roleMap.get(roleId);
        if (role && (!highestRole || role.position > highestRole.position)) {
            highestRole = role;
        }
    });

    return highestRole;
};

/**
 * Finds the highest role for a member that has a color.
 */
export const getHighestColorRoleForMember = (
    roleIds: string[] | undefined,
    roleMap: Map<string, Role>,
): Role | undefined => {
    if (!roleIds || roleIds.length === 0) return undefined;

    let highestRole: Role | undefined = undefined;
    roleIds.forEach((roleId) => {
        const role = roleMap.get(roleId);
        if (
            role &&
            (role.color || (role.colors && role.colors.length > 0)) &&
            (!highestRole || role.position > highestRole.position)
        ) {
            highestRole = role;
        }
    });

    return highestRole;
};

/**
 * Finds the highest role for a member that has an icon.
 */
export const getHighestRoleWithIconForMember = (
    roleIds: string[] | undefined,
    roleMap: Map<string, Role>,
): Role | undefined => {
    if (!roleIds || roleIds.length === 0) return undefined;

    let highestRole: Role | undefined = undefined;
    roleIds.forEach((roleId) => {
        const role = roleMap.get(roleId);
        if (
            role &&
            role.icon &&
            (!highestRole || role.position > highestRole.position)
        ) {
            highestRole = role;
        }
    });

    return highestRole;
};

/**
 * Resolves the user and role information for a message reply.
 */
export const resolveReplyTo = (
    msg: ChatMessage,
    allMessages: ChatMessage[],
    currentUser: User | undefined,
    friendUser: User | undefined,
    selectedFriendId: string | null,
    selectedServerId: string | null,
    serverMemberMap: Map<string, User>,
    highestRoleMap: Map<string, Role>,
    iconRoleMap: Map<string, Role>,
): ProcessedChatMessage['replyTo'] => {
    let replyTo: ProcessedChatMessage['replyTo'] = undefined;

    if (msg.referenced_message) {
        replyTo = {
            _id: msg.referenced_message._id,
            text: msg.referenced_message.text,
            user: {
                _id: msg.referenced_message.senderId,
                username: 'Unknown',
            } as User,
            role: undefined,
            iconRole: undefined,
        };
    }

    if (
        !replyTo &&
        msg.repliedToMessageId &&
        typeof msg.repliedToMessageId === 'object'
    ) {
        replyTo = {
            _id: msg.repliedToMessageId._id,
            text: msg.repliedToMessageId.text,
            user: {
                _id: msg.repliedToMessageId.senderId,
                username: 'Unknown',
            } as User,
            role: undefined,
            iconRole: undefined,
        };
    }

    if (!replyTo) {
        const repliedId = (msg.repliedToMessageId || msg.replyToId)?.toString();

        if (repliedId) {
            const repliedMsg = allMessages.find(
                (m) => m._id.toString() === repliedId,
            );

            if (repliedMsg) {
                replyTo = {
                    _id: repliedMsg._id,
                    text: repliedMsg.text,
                    user: {
                        _id: repliedMsg.senderId,
                        username: 'Unknown',
                    } as User,
                    role: undefined,
                    iconRole: undefined,
                };
            }
        }
    }

    if (!replyTo && msg.repliedTo) {
        replyTo = {
            _id: msg.repliedTo.messageId,
            text: msg.repliedTo.text,
            user: {
                _id: msg.repliedTo.senderId,
                username: msg.repliedTo.senderUsername || 'Unknown',
            } as User,
            role: undefined,
            iconRole: undefined,
        };
    }

    if (replyTo) {
        const replySenderId = replyTo.user?._id?.toString();
        if (replySenderId) {
            if (selectedFriendId) {
                replyTo.user =
                    replySenderId === currentUser?._id
                        ? (currentUser as User)
                        : (friendUser as User);
            } else if (selectedServerId) {
                replyTo.user =
                    serverMemberMap.get(replySenderId) || replyTo.user;
                replyTo.role = highestRoleMap.get(replySenderId);
                replyTo.iconRole = iconRoleMap.get(replySenderId);
            }
        }
    }

    if (replyTo && !replyTo.user) {
        replyTo.user = {
            _id: (msg.replyToId || msg.repliedToMessageId) as string,
            username: 'Unknown',
        } as User;
    }

    return replyTo;
};
