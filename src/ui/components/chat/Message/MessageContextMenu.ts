import React from 'react';

import {
    Copy,
    CornerUpLeft,
    Edit,
    Pin,
    SmilePlus,
    StickyNote,
    Trash2,
    UserMinus,
    UserPlus,
} from 'lucide-react';

import type { Friend } from '@/api/friends/friends.types';
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
                onEdit,
                onDelete,
                onTogglePin,
                onToggleSticky,
                onRemoveFriend,
                onAddFriend,
                onShowPicker,
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
        ],
    );
}
