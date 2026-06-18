import React, { useState } from 'react';

import { useLimitedAnimations } from '@/providers/limitedAnimationsContext';
import { Box } from '@/ui/components/layout/Box';
import { isAnimatedImageUrl } from '@/utils/animationPreferences';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';
import { getSafeUrl } from '@/utils/proxy';

import { PausedAnimatedImage } from './PausedAnimatedImage';

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

const AVATAR_SIZE_CLASSES = {
    xs: 'h-5 w-5 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-20 w-20 text-3xl',
};

export const UserProfilePictureIcon = ({
    src,
    username,
    size = 'md',
    className,
    onClick,
}: UserProfilePictureIconProps) => {
    const limitedAnimations = useLimitedAnimations();
    const isFilename = src && !isAbsoluteUrl(src) && !src.includes('/');
    const effectiveSrc = isFilename ? `/api/v1/profile/picture/${src}` : src;
    const iconUrl = getSafeUrl(
        resolveApiUrl(effectiveSrc || undefined) || undefined,
    );

    const [imgFailed, setImgFailed] = useState(false);
    const [prevIconUrl, setPrevIconUrl] = useState(iconUrl);
    if (iconUrl !== prevIconUrl) {
        setPrevIconUrl(iconUrl);
        setImgFailed(false);
    }

    const letter = (username || '?')[0].toUpperCase();

    return (
        <Box
            className={cn(
                'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--avatar-fallback-bg) font-bold text-(--avatar-fallback-text)',
                AVATAR_SIZE_CLASSES[size],
                className,
            )}
            onClick={onClick}
        >
            {iconUrl && !imgFailed ? (
                <PausedAnimatedImage
                    alt={username}
                    className="h-full w-full object-cover"
                    paused={limitedAnimations && isAnimatedImageUrl(iconUrl)}
                    src={iconUrl}
                    onError={() => setImgFailed(true)}
                />
            ) : (
                <span className="text-(--avatar-fallback-text)">{letter}</span>
            )}
        </Box>
    );
};
