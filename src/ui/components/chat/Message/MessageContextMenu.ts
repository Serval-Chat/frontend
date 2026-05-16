import React from 'react';

import {
    Check,
    Copy,
    CornerUpLeft,
    Edit,
    ListTree,
    Pin,
    Shield,
    SmilePlus,
    StickyNote,
    Trash2,
    UserMinus,
    UserPlus,
} from 'lucide-react';

import type { Friend } from '@/api/friends/friends.types';
import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import type { ContextMenuItem } from '@/ui/components/common/ContextMenu';

interface ContextMenuParams {
    message: ProcessedChatMessage;
    user: User;
    isMessageSender: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canPin: boolean;
    friends?: Friend[];
    onReplyToMessage?: (message: ProcessedChatMessage) => void;
    onEdit: () => void;
    onDelete: () => void;
    onTogglePin: () => void;
    onToggleSticky: () => void;
    onRemoveFriend: (id: string) => void;
    onAddFriend: (username: string) => void;
    onShowPicker: () => void;
    showColorResolverDebug?: boolean;
    onShowColorResolverOrder?: () => void;
    allServerRoles?: Role[];
    userRoles?: Role[];
    canManageRoles?: boolean;
    isOwner?: boolean;
    myHighestRolePosition?: number;
    onAddRole?: (roleId: string) => void;
    onRemoveRole?: (roleId: string) => void;
}

export function buildContextMenuItems({
    message,
    user,
    isMessageSender,
    canEdit,
    canDelete,
    canPin,
    friends,
    onReplyToMessage,
    onEdit,
    onDelete,
    onTogglePin,
    onToggleSticky,
    onRemoveFriend,
    onAddFriend,
    onShowPicker,
    showColorResolverDebug,
    onShowColorResolverOrder,
    allServerRoles,
    userRoles,
    canManageRoles,
    isOwner,
    myHighestRolePosition,
    onAddRole,
    onRemoveRole,
}: ContextMenuParams): ContextMenuItem[] {
    const items: ContextMenuItem[] = [];

    if (message.serverId && message.channelId) {
        items.push({
            label: 'Copy Message Link',
            icon: Copy,
            onClick: () => {
                const link = `/chat/@server/${message.serverId}/channel/${message.channelId}/message/${message._id}`;
                void navigator.clipboard.writeText(
                    `${window.location.origin}${link}`,
                );
            },
        });
        items.push({ type: 'divider' });
    }

    if (message.text) {
        items.push({
            label: 'Copy Text',
            icon: Copy,
            onClick: () => {
                void navigator.clipboard.writeText(message.text);
            },
        });
    }

    items.push({
        label: 'Copy Message ID',
        icon: Copy,
        onClick: () => {
            void navigator.clipboard.writeText(message._id);
        },
    });

    if (!isMessageSender) {
        const isFriend = friends?.some((f) => f._id === message.senderId);
        items.push({ type: 'divider' });

        if (isFriend) {
            items.push({
                label: 'Remove Friend',
                icon: UserMinus,
                variant: 'danger',
                onClick: () => onRemoveFriend(message.senderId),
            });
        } else if (!user?.isBot) {
            items.push({
                label: 'Add Friend',
                icon: UserPlus,
                onClick: () => onAddFriend(user.username),
            });
        }
    }

    if (onReplyToMessage) {
        items.unshift({
            label: 'Reply',
            icon: CornerUpLeft,
            onClick: () => onReplyToMessage(message),
        });
    }

    items.splice(onReplyToMessage ? 1 : 0, 0, {
        label: 'Add Reaction',
        icon: SmilePlus,
        onClick: onShowPicker,
    });

    if (showColorResolverDebug && onShowColorResolverOrder) {
        items.push({ type: 'divider' });
        items.push({
            label: 'Show color resolver order',
            icon: ListTree,
            onClick: onShowColorResolverOrder,
        });
    }

    if (canEdit) {
        items.push({
            label: 'Edit Message',
            icon: Edit,
            onClick: onEdit,
        });
    }

    if (canPin && message.serverId && message.channelId) {
        items.push({ type: 'divider' });
        items.push({
            label: message.isPinned ? 'Unpin Message' : 'Pin Message',
            icon: Pin,
            onClick: onTogglePin,
        });
        items.push({
            label: message.isSticky ? 'Unsticky Message' : 'Sticky Message',
            icon: StickyNote,
            onClick: onToggleSticky,
        });
    }

    if (canDelete) {
        items.push({ type: 'divider' });
        items.push({
            label: 'Delete Message',
            icon: Trash2,
            variant: 'danger',
            onClick: onDelete,
        });
    }

    if (
        allServerRoles &&
        canManageRoles &&
        onAddRole &&
        onRemoveRole &&
        message.serverId
    ) {
        items.push({ type: 'divider' });

        const sortedRoles = [...allServerRoles].sort(
            (a, b) => b.position - a.position,
        );
        const rolesToDisplay = sortedRoles.filter(
            (r) => r.name !== '@everyone',
        );

        items.push({
            label: 'Roles',
            icon: Shield,
            type: 'submenu',
            items:
                rolesToDisplay.length > 0
                    ? rolesToDisplay.map((r) => {
                          const hasRole = userRoles?.some(
                              (ur) => String(ur._id) === String(r._id),
                          );

                          const canManageThisRole =
                              isOwner ||
                              (myHighestRolePosition !== undefined &&
                                  myHighestRolePosition > r.position);

                          return {
                              label: r.name,
                              onClick: () => {
                                  if (!canManageThisRole) return;
                                  if (hasRole) {
                                      onRemoveRole(r._id);
                                  } else {
                                      onAddRole(r._id);
                                  }
                              },
                              rightIcon: hasRole ? Check : undefined,
                              variant: !canManageThisRole ? 'ghost' : 'normal',
                              preventClose: true,
                          };
                      })
                    : [
                          {
                              label: 'No roles',
                              onClick: () => {},
                              variant: 'ghost',
                          },
                      ],
        });
    }

    return items;
}

export function useMessageContextMenu(
    params: ContextMenuParams,
): ContextMenuItem[] {
    const {
        message,
        user,
        isMessageSender,
        canEdit,
        canDelete,
        canPin,
        friends,
        onReplyToMessage,
        onEdit,
        onDelete,
        onTogglePin,
        onToggleSticky,
        onRemoveFriend,
        onAddFriend,
        onShowPicker,
        showColorResolverDebug,
        onShowColorResolverOrder,
        allServerRoles,
        userRoles,
        canManageRoles,
        isOwner,
        myHighestRolePosition,
        onAddRole,
        onRemoveRole,
    } = params;

    return React.useMemo(
        () =>
            buildContextMenuItems({
                message,
                user,
                isMessageSender,
                canEdit,
                canDelete,
                canPin,
                friends,
                onReplyToMessage,
                onEdit: onEdit,
                onDelete: onDelete,
                onTogglePin: onTogglePin,
                onToggleSticky: onToggleSticky,
                onRemoveFriend,
                onAddFriend,
                onShowPicker,
                showColorResolverDebug,
                onShowColorResolverOrder,
                allServerRoles,
                userRoles,
                canManageRoles,
                isOwner,
                myHighestRolePosition,
                onAddRole,
                onRemoveRole,
            }),

        [
            message,
            user,
            isMessageSender,
            canEdit,
            canDelete,
            canPin,
            friends,
            onReplyToMessage,
            onEdit,
            onDelete,
            onTogglePin,
            onToggleSticky,
            onRemoveFriend,
            onAddFriend,
            onShowPicker,
            showColorResolverDebug,
            onShowColorResolverOrder,
            allServerRoles,
            userRoles,
            canManageRoles,
            isOwner,
            myHighestRolePosition,
            onAddRole,
            onRemoveRole,
        ],
    );
}
