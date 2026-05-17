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
        const isDefaultColor = (c: string): boolean =>
            c.toLowerCase() === '#99aab5';
        const hasColor =
            (!!role?.color && !isDefaultColor(role.color)) ||
            !!(role?.colors && role.colors.length > 0) ||
            (!!role?.startColor && !!role?.endColor);
        if (
            role &&
            hasColor &&
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
    messageById?: Map<string, ChatMessage>,
): ProcessedChatMessage['replyTo'] => {
    let replyTo: ProcessedChatMessage['replyTo'] = undefined;

    if (msg.referenced_message) {
        let referencedUser: User | undefined = undefined;
        let isWebhook = false;
        if (
            msg.referenced_message.isWebhook &&
            msg.referenced_message.webhookUsername
        ) {
            isWebhook = true;
            const rawAvatar =
                msg.referenced_message.webhookAvatarUrl || undefined;
            const avatarUrl =
                rawAvatar &&
                (rawAvatar.startsWith('https://') ||
                    rawAvatar.startsWith('http://'))
                    ? `/api/v1/embed/proxy?url=${encodeURIComponent(rawAvatar)}`
                    : rawAvatar;
            referencedUser = {
                _id: `webhook-${msg.referenced_message._id}`,
                username: msg.referenced_message.webhookUsername,
                displayName: msg.referenced_message.webhookUsername,
                profilePicture: avatarUrl,
                isBot: false,
                createdAt: new Date(msg.referenced_message.createdAt),
            } as User;
        }

        replyTo = {
            _id: msg.referenced_message._id,
            text: msg.referenced_message.text,
            user:
                referencedUser ||
                ({
                    _id: msg.referenced_message.senderId,
                    username: 'Unknown',
                } as User),
            role: undefined,
            iconRole: undefined,
            interaction: msg.referenced_message.interaction,
            isEdited: msg.referenced_message.isEdited,
            deletedAt: msg.referenced_message.deletedAt,
            isWebhook,
        };
    }

    if (
        !replyTo &&
        msg.repliedToMessageId &&
        typeof msg.repliedToMessageId === 'object'
    ) {
        let referencedUser: User | undefined = undefined;
        let isWebhook = false;
        const parent = msg.repliedToMessageId as unknown as ChatMessage;
        if (parent.isWebhook && parent.webhookUsername) {
            isWebhook = true;
            const rawAvatar = parent.webhookAvatarUrl || undefined;
            const avatarUrl =
                rawAvatar &&
                (rawAvatar.startsWith('https://') ||
                    rawAvatar.startsWith('http://'))
                    ? `/api/v1/embed/proxy?url=${encodeURIComponent(rawAvatar)}`
                    : rawAvatar;
            referencedUser = {
                _id: `webhook-${parent._id}`,
                username: parent.webhookUsername,
                displayName: parent.webhookUsername,
                profilePicture: avatarUrl,
                isBot: false,
                createdAt: new Date(parent.createdAt),
            } as User;
        }

        replyTo = {
            _id: parent._id,
            text: parent.text,
            user:
                referencedUser ||
                ({
                    _id: parent.senderId,
                    username: 'Unknown',
                } as User),
            role: undefined,
            iconRole: undefined,
            interaction: parent.interaction,
            isEdited: parent.isEdited,
            deletedAt: parent.deletedAt,
            isWebhook,
        };
    }

    if (!replyTo) {
        const repliedId = (msg.repliedToMessageId || msg.replyToId)?.toString();

        if (repliedId) {
            const repliedMsg =
                messageById?.get(repliedId) ??
                allMessages.find((m) => m._id.toString() === repliedId);

            if (repliedMsg) {
                let referencedUser: User | undefined = undefined;
                let isWebhook = false;
                if (repliedMsg.isWebhook && repliedMsg.webhookUsername) {
                    isWebhook = true;
                    const rawAvatar = repliedMsg.webhookAvatarUrl || undefined;
                    const avatarUrl =
                        rawAvatar &&
                        (rawAvatar.startsWith('https://') ||
                            rawAvatar.startsWith('http://'))
                            ? `/api/v1/embed/proxy?url=${encodeURIComponent(rawAvatar)}`
                            : rawAvatar;
                    referencedUser = {
                        _id: `webhook-${repliedMsg._id}`,
                        username: repliedMsg.webhookUsername,
                        displayName: repliedMsg.webhookUsername,
                        profilePicture: avatarUrl,
                        isBot: false,
                        createdAt: new Date(repliedMsg.createdAt),
                    } as User;
                }

                replyTo = {
                    _id: repliedMsg._id,
                    text: repliedMsg.text,
                    user:
                        referencedUser ||
                        ({
                            _id: repliedMsg.senderId,
                            username: 'Unknown',
                        } as User),
                    role: undefined,
                    iconRole: undefined,
                    interaction: repliedMsg.interaction,
                    isEdited: repliedMsg.isEdited,
                    deletedAt: repliedMsg.deletedAt,
                    isWebhook,
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
                displayName: msg.repliedTo.senderUsername || 'Unknown',
                isBot: false,
            } as User,
            role: undefined,
            iconRole: undefined,
            isWebhook: false,
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
