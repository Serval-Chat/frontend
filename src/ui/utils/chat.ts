import type { ChatMessage } from '@/api/chat/chat.types';
import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import type { ProcessedChatMessage } from '@/types/chat.ui';

export const getValidMessageInteraction = (
    interaction: ChatMessage['interaction'],
): ChatMessage['interaction'] | undefined => {
    if (!interaction?.command?.trim()) return undefined;
    return interaction;
};

/**
 * Resolves the user object for a webhook message.
 */
export const resolveWebhookUser = (msg: ChatMessage): User | undefined => {
    if (msg.isWebhook && msg.webhookUsername) {
        const rawAvatar = msg.webhookAvatarUrl || undefined;
        const avatarUrl =
            rawAvatar &&
            (rawAvatar.startsWith('https://') ||
                rawAvatar.startsWith('http://'))
                ? `/api/v1/embed/proxy?url=${encodeURIComponent(rawAvatar)}`
                : rawAvatar;
        return {
            _id: `webhook-${msg._id}`,
            username: msg.webhookUsername,
            displayName: msg.webhookUsername,
            profilePicture: avatarUrl,
            createdAt: new Date(msg.createdAt),
        } as User;
    }
    return undefined;
};

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
        referencedUser = resolveWebhookUser(msg.referenced_message);
        if (referencedUser) {
            isWebhook = true;
            referencedUser.isBot = false;
        }

        replyTo = {
            _id: msg.referenced_message._id,
            text: msg.referenced_message.text,
            attachments: msg.referenced_message.attachments,
            user:
                referencedUser ||
                ({
                    _id: msg.referenced_message.senderId,
                    username: 'Unknown',
                } as User),
            role: undefined,
            iconRole: undefined,
            interaction: getValidMessageInteraction(
                msg.referenced_message.interaction,
            ),
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
        referencedUser = resolveWebhookUser(parent);
        if (referencedUser) {
            isWebhook = true;
            referencedUser.isBot = false;
        }

        replyTo = {
            _id: parent._id,
            text: parent.text,
            attachments: parent.attachments,
            user:
                referencedUser ||
                ({
                    _id: parent.senderId,
                    username: 'Unknown',
                } as User),
            role: undefined,
            iconRole: undefined,
            interaction: getValidMessageInteraction(parent.interaction),
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
                referencedUser = resolveWebhookUser(repliedMsg);
                if (referencedUser) {
                    isWebhook = true;
                    referencedUser.isBot = false;
                }

                replyTo = {
                    _id: repliedMsg._id,
                    text: repliedMsg.text,
                    attachments: repliedMsg.attachments,
                    user:
                        referencedUser ||
                        ({
                            _id: repliedMsg.senderId,
                            username: 'Unknown',
                        } as User),
                    role: undefined,
                    iconRole: undefined,
                    interaction: getValidMessageInteraction(
                        repliedMsg.interaction,
                    ),
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
