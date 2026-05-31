import React from 'react';

import { Box } from '@/ui/components/layout/Box';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';
import { getSafeUrl } from '@/utils/proxy';

interface UserProfilePictureIconProps {
    src?: string | null;
    username: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
}

const isAbsoluteUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

export const UserProfilePictureIcon = ({
    src,
    username,
    size = 'md',
    className,
    onClick,
}: UserProfilePictureIconProps) => {
    const isFilename = src && !isAbsoluteUrl(src) && !src.includes('/');
    const effectiveSrc = isFilename ? `/api/v1/profile/picture/${src}` : src;
    const iconUrl = getSafeUrl(
        resolveApiUrl(effectiveSrc || undefined) || undefined,
    );

    const initials = (username || '')
        .split(' ')
        .map((word): string => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const sizeClasses = {
        xs: 'h-5 w-5 text-[10px]',
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-20 w-20 text-3xl',
    };

    return (
        <Box
            className={cn(
                'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--avatar-fallback-bg)] font-bold text-[var(--avatar-fallback-text)]',
                sizeClasses[size],
                className,
            )}
            onClick={onClick}
        >
            {iconUrl ? (
                <img
                    alt={username}
                    className="h-full w-full object-cover"
                    src={iconUrl}
                />
            ) : (
                <span className="text-[var(--avatar-fallback-text)]">
                    {initials}
                </span>
            )}
        </Box>
    );
};
