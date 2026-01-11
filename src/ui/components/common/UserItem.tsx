import React from 'react';

import { Copy, MessageSquare, UserMinus, UserPlus } from 'lucide-react';

import {
    useFriends,
    useRemoveFriend,
    useSendFriendRequest,
} from '@/api/friends/friends.queries';
import type { Role } from '@/api/servers/servers.types';
import { useMe, useUserById } from '@/api/users/users.queries';
import { useAppDispatch } from '@/store/hooks';
import { setSelectedFriendId } from '@/store/slices/navSlice';
import { cn } from '@/utils/cn';

import { ContextMenu, type ContextMenuItem } from './ContextMenu';
import { StyledUserName } from './StyledUserName';
import { UserProfilePicture } from './UserProfilePicture';

interface UserItemProps {
    userId: string;
    initialData?: {
        username: string;
        displayName?: string;
        profilePicture?: string | null;
        customStatus?: { text?: string; emoji?: string } | null;
    };
    isActive?: boolean;
    onClick?: () => void;
    className?: string;
    noFetch?: boolean;
    role?: Role;
    disableCustomFonts?: boolean;
}

/**
 * @description Renders a user item with avatar, styled username, and custom status.
 */
export const UserItem: React.FC<UserItemProps> = ({
    userId,
    initialData,
    isActive,
    onClick,
    className,
    noFetch,
    role,
    disableCustomFonts,
}) => {
    const dispatch = useAppDispatch();
    const { data: currentUser } = useMe();
    const { data: userProfile } = useUserById(userId, { enabled: !noFetch });
    const { data: friends } = useFriends();
    const { mutate: sendFriendRequest } = useSendFriendRequest();
    const { mutate: removeFriend } = useRemoveFriend();

    const username = userProfile?.username || initialData?.username || '';
    const displayName = userProfile?.displayName || initialData?.displayName;
    const profilePicture =
        userProfile?.profilePicture || initialData?.profilePicture || null;
    const customStatus = userProfile?.customStatus || initialData?.customStatus;

    const isFriend = friends?.some((f) => f._id === userId);
    const isMe = currentUser?._id === userId;

    const items: ContextMenuItem[] = [];

    // Group 1: DM Actions
    if (isFriend) {
        items.push({
            label: 'Open DMs',
            icon: MessageSquare,
            onClick: () => dispatch(setSelectedFriendId(userId)),
        });
    }

    // Group 2: Friend Management (only if not me)
    if (!isMe) {
        if (items.length > 0) items.push({ type: 'divider' });

        if (isFriend) {
            items.push({
                label: 'Remove Friend',
                icon: UserMinus,
                onClick: () => removeFriend(userId),
                variant: 'danger',
            });
        } else {
            items.push({
                label: 'Add Friend',
                icon: UserPlus,
                onClick: () => sendFriendRequest(username),
            });
        }
    }

    // Group 3: Devtools of some sort (Copy ID)
    if (items.length > 0) items.push({ type: 'divider' });
    items.push({
        label: 'Copy User ID',
        icon: Copy,
        onClick: () => {
            navigator.clipboard.writeText(userId);
        },
    });

    const contextMenuItems = items;

    return (
        <ContextMenu items={contextMenuItems} className="w-full">
            <div
                onClick={onClick}
                className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors w-full min-w-0',
                    'hover:bg-[var(--color-bg-subtle)]',
                    isActive
                        ? 'bg-[var(--color-bg-subtle)] text-foreground'
                        : 'text-foreground-muted',
                    className
                )}
            >
                <UserProfilePicture
                    src={profilePicture}
                    username={displayName || username}
                    size="sm"
                />
                <div className="flex-1 min-w-0">
                    <StyledUserName
                        user={userProfile}
                        role={role}
                        disableCustomFonts={disableCustomFonts}
                    >
                        {displayName || username}
                    </StyledUserName>
                    {(customStatus?.text || customStatus?.emoji) && (
                        <div className="text-xs text-foreground-muted truncate flex items-center gap-1">
                            {customStatus.emoji && (
                                <span className="shrink-0">
                                    {customStatus.emoji}
                                </span>
                            )}
                            {customStatus.text && (
                                <span className="truncate">
                                    {customStatus.text}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ContextMenu>
    );
};
