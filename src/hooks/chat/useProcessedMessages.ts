import { useMemo } from 'react';

import type { ChatMessage } from '@/api/chat/chat.types';
import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { resolveReplyTo } from '@/ui/utils/chat';

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
): ProcessedChatMessage[] =>
    useMemo(() => {
        if (!rawMessagesData) return [];

        // Flatten all pages and sort chronologically
        const allMessages = rawMessagesData.pages
            .flat()
            .sort(
                (a, b) =>
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime(),
            );

        return allMessages.map((msg) => {
            let user: User | undefined = undefined;
            let role: Role | undefined = undefined;
            let iconRole: Role | undefined = undefined;

            // Handle webhooks
            if (msg.isWebhook && msg.webhookUsername) {
                user = {
                    _id: `webhook-${msg._id}`,
                    username: msg.webhookUsername,
                    displayName: msg.webhookUsername,
                    profilePicture: msg.webhookAvatarUrl || undefined,
                    createdAt: new Date(msg.createdAt),
                } as User;
            }

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
            );

            return {
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
        });
    }, [
        rawMessagesData,
        currentUser,
        friendUser,
        selectedFriendId,
        selectedServerId,
        serverMemberMap,
        highestRoleMap,
        iconRoleMap,
    ]);
