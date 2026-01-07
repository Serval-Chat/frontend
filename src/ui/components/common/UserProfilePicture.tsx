import React from 'react';
import { UserProfilePictureIcon } from './UserProfilePictureIcon';
import {
    UserProfileStatusIndicator,
    type UserStatus,
} from './UserProfileStatusIndicator';
import { cn } from '@/utils/cn';

interface UserProfilePictureProps {
    src?: string | null;
    username: string;
    status?: UserStatus;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const UserProfilePicture: React.FC<UserProfilePictureProps> = ({
    src,
    username,
    status = 'offline',
    size = 'md',
    className,
}) => {
    return (
        <div className={cn('relative inline-block', className)}>
            <UserProfilePictureIcon src={src} username={username} size={size} />
            <UserProfileStatusIndicator status={status} />
        </div>
    );
};
