import { useMemo, useState } from 'react';

import type { ChatMessage } from '@/api/chat/chat.types';
import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { resolveReplyTo, resolveWebhookUser } from '@/ui/utils/chat';

/**
 * @description Hook to process raw message data into a flattened, resolved list.
 */
export const useProcessedMessages = (
    rawMessagesData: { pages: ChatMessage[][] } | undefined,
    currentUser: User | undefined,
    friendUser: User | undefined,
    selectedFriendId: string | null,
    selectedServerId: string | null,
    serverMemberMap: Map<string, User>,
    highestRoleMap: Map<string, Role>,
    iconRoleMap: Map<string, Role>,
): ProcessedChatMessage[] => {
    const [cache] = useState(
        () => new WeakMap<ChatMessage, ProcessedChatMessage>(),
    );

    return useMemo(() => {
        if (!rawMessagesData) return [];

        // Flatten all pages and sort chronologically
        const allMessages = rawMessagesData.pages
            .flat()
            .sort((a, b) =>
                a.createdAt < b.createdAt
                    ? -1
                    : a.createdAt > b.createdAt
                      ? 1
                      : 0,
            );
        const messageById = new Map<string, ChatMessage>();
        allMessages.forEach((message) => {
            messageById.set(message._id.toString(), message);
        });

        const result = allMessages.map((msg) => {
            let user: User | undefined = undefined;
            let role: Role | undefined = undefined;
            let iconRole: Role | undefined = undefined;

            // Handle webhooks
            user = resolveWebhookUser(msg);

            // Resolve developer/character info if missing
            if (!user) {
                if (selectedFriendId) {
                    user =
                        msg.senderId === currentUser?._id
                            ? (currentUser as User)
                            : (friendUser as User);
                } else if (selectedServerId) {
                    user = serverMemberMap.get(msg.senderId as string) as User;
                    role = highestRoleMap.get(msg.senderId as string);
                    iconRole = iconRoleMap.get(msg.senderId as string);
                }
            }

            if (!user && msg.isEphemeral && msg.senderUsername) {
                user = {
                    _id: msg.senderId,
                    username: msg.senderUsername,
                    displayName: msg.senderUsername,
                    profilePicture: msg.senderProfilePicture ?? undefined,
                    isBot: msg.senderIsBot,
                } as User;
            }

            // Resolve reply
            const resolvedReplyTo = resolveReplyTo(
                msg,
                allMessages,
                currentUser,
                friendUser,
                selectedFriendId,
                selectedServerId,
                serverMemberMap,
                highestRoleMap,
                iconRoleMap,
                messageById,
            );

            const next = {
                ...msg,
                user:
                    user ||
                    ({ _id: msg.senderId, username: 'Unknown' } as User),
                role: role,
                iconRole: iconRole,
                replyTo: resolvedReplyTo,
                createdAt:
                    typeof msg.createdAt === 'string'
                        ? msg.createdAt
                        : new Date(msg.createdAt).toISOString(),
            } as ProcessedChatMessage;

            const prev = cache.get(msg);
            if (prev) {
                const sameCore =
                    prev.text === next.text &&
                    prev.editedAt === next.editedAt &&
                    prev.deletedAt === next.deletedAt &&
                    prev.isEdited === next.isEdited &&
                    prev.isPinned === next.isPinned &&
                    prev.isSticky === next.isSticky &&
                    prev.reactions === next.reactions &&
                    prev.embeds === next.embeds &&
                    prev.poll === next.poll &&
                    prev.user === next.user &&
                    prev.role === next.role &&
                    prev.iconRole === next.iconRole &&
                    prev.replyTo?._id === next.replyTo?._id &&
                    prev.replyTo?.text === next.replyTo?.text &&
                    prev.replyTo?.isEdited === next.replyTo?.isEdited &&
                    prev.replyTo?.deletedAt === next.replyTo?.deletedAt;

                if (sameCore) {
                    return prev;
                }
            }

            cache.set(msg, next);
            return next;
        });

        return result;
    }, [
        rawMessagesData,
        currentUser,
        friendUser,
        selectedFriendId,
        selectedServerId,
        serverMemberMap,
        highestRoleMap,
        iconRoleMap,
        cache,
    ]);
};
