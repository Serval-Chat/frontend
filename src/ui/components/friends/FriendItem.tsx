import React from 'react';
import type { Friend } from '@/api/friends/friends.types';
import { UserProfilePicture } from '../common/UserProfilePicture';
import { cn } from '@/utils/cn';
import { useUserById } from '@/api/users/users.queries';
import { StyledUserName } from '../common/StyledUserName';

interface FriendItemProps {
    friend: Friend;
    isActive?: boolean;
    onClick?: () => void;
}

export const FriendItem: React.FC<FriendItemProps> = ({
    friend,
    isActive,
    onClick,
}) => {
    const { data: user } = useUserById(friend._id);

    return (
        <div
            onClick={onClick}
            className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors',
                'hover:bg-[--color-bg-subtle]',
                isActive
                    ? 'bg-[--color-bg-subtle] text-foreground'
                    : 'text-foreground-muted'
            )}
        >
            <UserProfilePicture
                src={friend.profilePicture}
                username={friend.displayName || friend.username}
                size="sm"
            />
            <div className="flex-1 min-w-0">
                <StyledUserName user={user}>
                    {friend.displayName || friend.username}
                </StyledUserName>
                {friend.customStatus?.text && (
                    <div className="text-xs text-foreground-muted truncate">
                        {friend.customStatus.text}
                    </div>
                )}
            </div>
        </div>
    );
};
