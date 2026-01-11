import React from 'react';

import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';

interface UserProfilePictureIconProps {
    src?: string | null;
    username: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export const UserProfilePictureIcon: React.FC<UserProfilePictureIconProps> = ({
    src,
    username,
    size = 'md',
    className,
}) => {
    const iconUrl = resolveApiUrl(src || undefined);

    const initials = username
        .split(' ')
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-20 h-20 text-2xl',
    };

    return (
        <div
            className={cn(
                'flex items-center justify-center rounded-full overflow-hidden bg-[--color-bg-subtle] text-foreground-muted font-bold shrink-0',
                sizeClasses[size],
                className
            )}
        >
            {iconUrl ? (
                <img
                    src={iconUrl}
                    alt={username}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span>{initials}</span>
            )}
        </div>
    );
};
