import React, { useState } from 'react';

import { getDecorationUrl } from '@/api/decorations';
import { useLimitedAnimations } from '@/providers/limitedAnimationsContext';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

import { PausedAnimatedImage } from './PausedAnimatedImage';
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
    decorationId?: string | null;
    onClick?: (e: React.MouseEvent) => void;
}

const DECORATION_SIZE_PX: Record<string, number> = {
    xs: 64,
    sm: 64,
    md: 128,
    lg: 128,
    xl: 256,
};

export const UserProfilePicture = ({
    src,
    username,
    status = 'offline',
    size = 'md',
    noIndicator = false,
    className,
    decorationId,
    onClick,
}: UserProfilePictureProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const limitedAnimations = useLimitedAnimations();

    return (
        <Box
            className={cn(
                'relative inline-flex items-center justify-center',
                onClick && 'cursor-pointer',
                className,
            )}
            onMouseEnter={() => {
                setIsHovered(true);
            }}
            onMouseLeave={() => {
                setIsHovered(false);
            }}
        >
            <UserProfilePictureIcon
                size={size}
                src={src}
                username={username}
                onClick={onClick}
            />
            {decorationId ? (
                <PausedAnimatedImage
                    alt=""
                    className="pointer-events-none absolute inset-0 z-10 h-full w-full scale-125 object-cover"
                    paused={limitedAnimations || !isHovered}
                    src={getDecorationUrl(
                        decorationId,
                        DECORATION_SIZE_PX[size] ?? 128,
                    )}
                />
            ) : null}
            {noIndicator ? null : (
                <UserProfileStatusIndicator size={size} status={status} />
            )}
        </Box>
    );
};
