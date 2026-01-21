import React from 'react';

import {
    Copy,
    MessageSquare,
    User as UserIcon,
    UserMinus,
    UserPlus,
} from 'lucide-react';

import {
    useFriends,
    useRemoveFriend,
    useSendFriendRequest,
} from '@/api/friends/friends.queries';
import type { Role } from '@/api/servers/servers.types';
import { useMe, useUserById } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedFriendId } from '@/store/slices/navSlice';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { ProfilePopup } from '@/ui/components/profile/ProfilePopup';
import { cn } from '@/utils/cn';

import { ContextMenu, type ContextMenuItem } from './ContextMenu';
import { StyledUserName } from './StyledUserName';
import { UserProfilePicture } from './UserProfilePicture';

interface UserItemProps {
    userId: string;
    user?: User;

    initialData?: {
        username: string;
        displayName?: string | null;
        profilePicture?: string | null;
        customStatus?: { text?: string; emoji?: string } | null;
    };
    isActive?: boolean;
    onClick?: () => void;
    className?: string;
    noFetch?: boolean;
    role?: Role;
    allRoles?: Role[];
    joinedAt?: string;
    disableCustomFonts?: boolean;
    disableGlow?: boolean;
}

/**
 * @description Renders a user item with avatar, styled username, and custom status.
 */
export const UserItem: React.FC<UserItemProps> = ({
    userId,
    user: providedUser,
    initialData,

    isActive,
    onClick,
    className,
    noFetch,
    role,
    allRoles,
    joinedAt,
    disableCustomFonts,
    disableGlow,
}) => {
    const dispatch = useAppDispatch();
    const { data: currentUser } = useMe();
    const { data: fetchedUser } = useUserById(userId, {
        enabled: !noFetch && !providedUser,
    });
    const userProfile = providedUser || fetchedUser;
    const { data: friends } = useFriends();

    const { mutate: sendFriendRequest } = useSendFriendRequest();
    const { mutate: removeFriend } = useRemoveFriend();

    const [showProfile, setShowProfile] = React.useState(false);
    const itemRef = React.useRef<HTMLDivElement>(null);

    const username = userProfile?.username || initialData?.username || '';
    const displayName = userProfile?.displayName || initialData?.displayName;
    const profilePicture =
        userProfile?.profilePicture || initialData?.profilePicture || null;
    const customStatus = userProfile?.customStatus || initialData?.customStatus;

    const isFriend = friends?.some((f) => f._id === userId);
    const isMe = currentUser?._id === userId;

    const items: ContextMenuItem[] = [];

    // Group 0: Profile
    items.push({
        label: 'Show Profile',
        icon: UserIcon,
        onClick: () => setShowProfile(true),
    });

    // Group 1: DM Actions
    if (isFriend) {
        items.push({ type: 'divider' });
        items.push({
            label: 'Open DMs',
            icon: MessageSquare,
            onClick: () => dispatch(setSelectedFriendId(userId)),
        });
    }

    // Group 2: Friend Management (only if not me)
    if (!isMe) {
        items.push({ type: 'divider' });
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
    items.push({ type: 'divider' });
    items.push({
        label: 'Copy User ID',
        icon: Copy,
        onClick: () => {
            void navigator.clipboard.writeText(userId);
        },
    });

    const contextMenuItems = items;

    const presence = useAppSelector((state) => state.presence.users[userId]);
    const presenceStatus = presence?.status || 'offline';
    const presenceCustomText = presence?.customStatus || customStatus?.text;

    return (
        <>
            <ContextMenu className="w-full" items={contextMenuItems}>
                <Box
                    className={cn(
                        'flex items-center gap-3 px-3 py-1 rounded-md cursor-pointer transition-colors w-full min-w-0',

                        'hover:bg-[var(--color-bg-subtle)]',
                        isActive
                            ? 'bg-[var(--color-bg-subtle)] text-foreground'
                            : 'text-foreground-muted',
                        className,
                    )}
                    ref={itemRef}
                    onClick={() => {
                        if (onClick) {
                            onClick();
                        } else {
                            setShowProfile(true);
                        }
                    }}
                >
                    <UserProfilePicture
                        size="sm"
                        src={profilePicture}
                        status={presenceStatus}
                        username={displayName || username}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowProfile(true);
                        }}
                    />

                    <Box className="flex-1 min-w-0">
                        <StyledUserName
                            disableCustomFonts={disableCustomFonts}
                            disableGlow={disableGlow}
                            role={role}
                            user={userProfile}
                        >
                            {displayName || username}
                        </StyledUserName>
                        {(presenceCustomText || customStatus?.emoji) &&
                            presenceStatus !== 'offline' && (
                                <Box className="text-xs text-foreground-muted truncate flex items-center gap-1">
                                    {customStatus?.emoji && (
                                        <Text
                                            as="span"
                                            className="shrink-0"
                                            size="xs"
                                        >
                                            {customStatus.emoji}
                                        </Text>
                                    )}
                                    {presenceCustomText && (
                                        <Text
                                            as="span"
                                            className="truncate"
                                            size="xs"
                                        >
                                            {presenceCustomText}
                                        </Text>
                                    )}
                                </Box>
                            )}
                    </Box>
                </Box>
            </ContextMenu>
            <ProfilePopup
                disableCustomFonts={disableCustomFonts}
                disableGlow={disableGlow}
                isOpen={showProfile}
                joinedAt={joinedAt}
                role={role}
                roles={allRoles}
                triggerRef={itemRef}
                user={userProfile || undefined}
                userId={userId}
                onClose={() => setShowProfile(false)}
            />
        </>
    );
};
