import React from 'react';

import { m } from 'framer-motion';

import type { Server } from '@/api/servers/servers.types';
import { useLimitedAnimations } from '@/providers/limitedAnimationsContext';
import { Badge } from '@/ui/components/common/Badge';
import { PausedAnimatedImage } from '@/ui/components/common/PausedAnimatedImage';
import { isAnimatedImageUrl } from '@/utils/animationPreferences';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';

interface ServerIconProps {
    server: Omit<Server, 'id' | 'ownerId'> | Server;
    isActive?: boolean;
    onClick?: () => void;
    className?: string;
    size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    badgeCount?: number;
}

const SIZE_CLASSES = {
    xxs: 'w-4 h-4 text-[7px]',
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-9 h-9 text-[10px]',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xxl: 'w-20 h-20 text-xl',
};

const ROUNDED_CLASSES = {
    xxs: 'rounded-sm',
    xs: 'rounded-md',
    sm: 'rounded-[0.75rem]',
    md: 'rounded-[1.2rem]',
    lg: 'rounded-[1.5rem]',
    xl: 'rounded-[1.8rem]',
};

const ACTIVE_ROUNDED_CLASSES = {
    xxs: 'rounded-sm',
    xs: 'rounded-md',
    sm: 'rounded-lg',
    md: 'rounded-[0.75rem]',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
};

export const ServerIcon = React.memo(
    ({
        server,
        isActive,
        onClick,
        className,
        size = 'md',
        badgeCount,
    }: ServerIconProps) => {
        const limitedAnimations = useLimitedAnimations();
        const iconUrl = resolveApiUrl(server.icon);
        const shouldShowIcon = !!iconUrl;

        const initials = server.name
            .split(' ')
            .map((word: string): string => word[0] ?? '')
            .join('')
            .slice(0, 3)
            .toUpperCase();

        return (
            <m.div
                className={cn(
                    'group relative flex cursor-pointer items-center justify-center transition-all duration-200 select-none',
                    isActive
                        ? `bg-[--color-primary] text-foreground-inverse`
                        : `text-foreground-muted bg-[--color-bg-subtle] hover:bg-[--color-primary] hover:text-foreground-inverse`,
                    SIZE_CLASSES[size as keyof typeof SIZE_CLASSES] ||
                        SIZE_CLASSES.md,
                    className,
                )}
                role="button"
                tabIndex={0}
                title={server.name}
                onKeyDown={(e): void => {
                    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                        onClick();
                    }
                }}
                onTap={onClick}
            >
                <div
                    className={cn(
                        'flex h-full w-full items-center justify-center overflow-hidden bg-bg-secondary transition-all duration-200',
                        isActive
                            ? ACTIVE_ROUNDED_CLASSES[size]
                            : `${ROUNDED_CLASSES[size]} group-hover:${
                                  ACTIVE_ROUNDED_CLASSES[size]
                              }`,
                    )}
                >
                    {shouldShowIcon ? (
                        <PausedAnimatedImage
                            alt={server.name}
                            className="h-full w-full object-cover"
                            decoding="async"
                            draggable="false"
                            loading="lazy"
                            paused={
                                limitedAnimations
                                    ? isAnimatedImageUrl(iconUrl)
                                    : false
                            }
                            src={iconUrl}
                        />
                    ) : (
                        <span className="font-bold">{initials}</span>
                    )}
                </div>
                {badgeCount !== undefined && badgeCount > 0 ? (
                    <Badge count={badgeCount} />
                ) : null}
            </m.div>
        );
    },
);

ServerIcon.displayName = 'ServerIcon';
