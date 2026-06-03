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
import { RoleDot } from '@/ui/components/common/RoleDot';
import { Box } from '@/ui/components/layout/Box';

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
            onClick: (): void => {
                const link = `/chat/@server/${message.serverId}/channel/${message.channelId}/message/${message.id}`;
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
            onClick: (): void => {
                void navigator.clipboard.writeText(message.text);
            },
        });
    }

    items.push({
        label: 'Copy Message ID',
        icon: Copy,
        onClick: (): void => {
            void navigator.clipboard.writeText(message.id);
        },
    });

    if (!isMessageSender) {
        const isFriend = friends?.some(
            (f): boolean => f.id === message.senderId,
        );
        items.push({ type: 'divider' });

        if (isFriend) {
            items.push({
                label: 'Remove Friend',
                icon: UserMinus,
                variant: 'danger',
                onClick: (): void => onRemoveFriend(message.senderId),
            });
        } else if (!user?.isBot) {
            items.push({
                label: 'Add Friend',
                icon: UserPlus,
                onClick: (): void => onAddFriend(user.username),
            });
        }
    }

    if (onReplyToMessage) {
        items.unshift({
            label: 'Reply',
            icon: CornerUpLeft,
            onClick: (): void => onReplyToMessage(message),
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
            (a, b): number => b.position - a.position,
        );
        const rolesToDisplay = sortedRoles.filter(
            (r): boolean => r.name !== '@everyone',
        );

        items.push({
            label: 'Roles',
            icon: Shield,
            type: 'submenu',
            items:
                rolesToDisplay.length > 0
                    ? rolesToDisplay.map((r) => {
                          const hasRole = userRoles?.some(
                              (ur): boolean => String(ur.id) === String(r.id),
                          );

                          const canManageThisRole =
                              isOwner ||
                              (myHighestRolePosition !== undefined &&
                                  myHighestRolePosition > r.position);

                          return {
                              indent: false,
                              label: React.createElement(
                                  Box,
                                  { className: 'flex items-center gap-2' },
                                  React.createElement(RoleDot, {
                                      role: r,
                                      size: 8,
                                  }),
                                  React.createElement(
                                      'span',
                                      { className: 'truncate' },
                                      r.name,
                                  ),
                              ),
                              onClick: (): void => {
                                  if (!canManageThisRole) return;
                                  if (hasRole) {
                                      onRemoveRole(r.id);
                                  } else {
                                      onAddRole(r.id);
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
                              onClick: (): void => {},
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
        (): ContextMenuItem[] =>
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
