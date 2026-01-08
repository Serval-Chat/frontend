import React from 'react';

import type { Role } from '@/api/servers/servers.types';
import { useUserById } from '@/api/users/users.queries';
import { cn } from '@/utils/cn';

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
    const { data: userProfile } = useUserById(userId, { enabled: !noFetch });

    const username = userProfile?.username || initialData?.username || '';
    const displayName = userProfile?.displayName || initialData?.displayName;
    const profilePicture =
        userProfile?.profilePicture || initialData?.profilePicture || null;
    const customStatus = userProfile?.customStatus || initialData?.customStatus;

    return (
        <div
            onClick={onClick}
            className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors w-full min-w-0',
                'hover:bg-[--color-bg-subtle]',
                isActive
                    ? 'bg-[--color-bg-subtle] text-foreground'
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
    );
};
