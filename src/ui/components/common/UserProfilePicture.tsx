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
    size?: 'sm' | 'md' | 'lg';
    noIndicator?: boolean;
    className?: string;
}

export const UserProfilePicture: React.FC<UserProfilePictureProps> = ({
    src,
    username,
    status = 'offline',
    size = 'md',
    noIndicator = false,
    className,
}) => {
    return (
        <div className={cn('relative inline-block', className)}>
            <UserProfilePictureIcon src={src} username={username} size={size} />
            {!noIndicator && <UserProfileStatusIndicator status={status} />}
        </div>
    );
};
