import React from 'react';

import { Box } from '@/ui/components/layout/Box';
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
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
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
}) => (
    <Box
        className={cn(
            'relative inline-flex items-center justify-center',
            onClick && 'cursor-pointer',
            className,
        )}
    >
        <UserProfilePictureIcon
            size={size}
            src={src}
            username={username}
            onClick={onClick}
        />
        {!noIndicator && (
            <UserProfileStatusIndicator size={size} status={status} />
        )}
    </Box>
);
