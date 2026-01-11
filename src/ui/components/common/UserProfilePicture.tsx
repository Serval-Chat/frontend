import React from 'react';

import { cn } from '@/utils/cn';

import { UserProfilePictureIcon } from './UserProfilePictureIcon';
import {
    UserProfileStatusIndicator,
    type UserStatus,
} from './UserProfileStatusIndicator';

interface UserProfilePictureProps {
    src?: string | null;
    username: string;
    status?: UserStatus;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    noIndicator?: boolean;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
}

export const UserProfilePicture: React.FC<UserProfilePictureProps> = ({
    src,
    username,
    status = 'offline',
    size = 'md',
    noIndicator = false,
    className,
    onClick,
}) => {
    return (
        <div
            className={cn(
                'relative inline-block',
                onClick && 'cursor-pointer',
                className
            )}
            onClick={onClick}
        >
            <UserProfilePictureIcon src={src} username={username} size={size} />
            {!noIndicator && (
                <UserProfileStatusIndicator status={status} size={size} />
            )}
        </div>
    );
};
