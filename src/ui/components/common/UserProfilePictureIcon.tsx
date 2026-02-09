import React from 'react';

import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';

interface UserProfilePictureIconProps {
    src?: string | null;
    username: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const isAbsoluteUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

export const UserProfilePictureIcon: React.FC<UserProfilePictureIconProps> = ({
    src,
    username,
    size = 'md',
    className,
}) => {
    const isFilename = src && !isAbsoluteUrl(src) && !src.includes('/');
    const effectiveSrc = isFilename ? `/api/v1/profile/picture/${src}` : src;
    const iconUrl = resolveApiUrl(effectiveSrc || undefined);

    const initials = (username || '')
        .split(' ')
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const sizeClasses = {
        xs: 'w-5 h-5 text-[10px]',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-20 h-20 text-2xl',
    };

    return (
        <Box
            className={cn(
                'flex items-center justify-center rounded-full overflow-hidden bg-[--color-bg-subtle] text-foreground-muted font-bold shrink-0',
                sizeClasses[size],
                className,
            )}
        >
            {iconUrl ? (
                <img
                    alt={username}
                    className="w-full h-full object-cover"
                    src={iconUrl}
                />
            ) : (
                <Text as="span" size="xs">
                    {initials}
                </Text>
            )}
        </Box>
    );
};
