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
    server: Pick<Server, 'name'> & Partial<Pick<Server, 'icon'>>;
    isActive?: boolean;
    isInServer?: boolean;
    animateOnlyInServerOrHover?: boolean;
    onClick?: () => void;
    className?: string;
    size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    badgeCount?: number;
    style?: React.CSSProperties;
}

const SIZE_CLASSES = {
    xxs: 'w-4 h-4 text-[7px]',
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-9 h-9 text-[10px]',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-xl',
    xxl: 'w-20 h-20 text-xl',
} as const;

const ROUNDED_CLASSES = {
    xxs: 'rounded-sm',
    xs: 'rounded-md',
    sm: 'rounded-[0.75rem]',
    md: 'rounded-[1.2rem]',
    lg: 'rounded-[1.5rem]',
    xl: 'rounded-[1.8rem]',
    xxl: 'rounded-[1.8rem]',
} as const;

const ACTIVE_ROUNDED_CLASSES = {
    xxs: 'rounded-sm',
    xs: 'rounded-md',
    sm: 'rounded-lg',
    md: 'rounded-[0.75rem]',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    xxl: 'rounded-2xl',
} as const;

const getInitials = (name?: string): string => {
    if (!name) return '';
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    // i hate utf16
    const letters = words.map((word) => Array.from(word)[0] ?? '').join('');
    return Array.from(letters).slice(0, 3).join('').toUpperCase();
};

export const ServerIcon = React.memo(
    ({
        server,
        isActive,
        isInServer,
        animateOnlyInServerOrHover = true,
        onClick,
        className,
        size = 'md',
        badgeCount,
        style,
    }: ServerIconProps) => {
        const [isHovered, setIsHovered] = React.useState(false);
        const limitedAnimations = useLimitedAnimations();
        const iconUrl = resolveApiUrl(server.icon);
        const shouldShowIcon = !!iconUrl;

        const initials = getInitials(server.name);

        const isAnimated = isAnimatedImageUrl(iconUrl);
        const canAnimate = Boolean(isInServer) || isHovered;
        const paused = limitedAnimations
            ? isAnimated
            : animateOnlyInServerOrHover
              ? isAnimated && !canAnimate
              : false;

        const effectiveSize = SIZE_CLASSES[size] || SIZE_CLASSES.md;
        const roundedClass = ROUNDED_CLASSES[size] || ROUNDED_CLASSES.md;
        const activeRoundedClass =
            ACTIVE_ROUNDED_CLASSES[size] || ACTIVE_ROUNDED_CLASSES.md;

        return (
            <m.div
                aria-label={server.name}
                className={cn(
                    'group relative flex items-center justify-center transition-all duration-200 select-none',
                    onClick ? 'cursor-pointer' : 'cursor-default',
                    effectiveSize,
                    className,
                )}
                role="button"
                style={style}
                tabIndex={0}
                onKeyDown={(e): void => {
                    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onClick();
                    }
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onTap={onClick}
            >
                <div
                    className={cn(
                        'flex h-full w-full items-center justify-center overflow-hidden transition-all duration-200',
                        shouldShowIcon
                            ? 'bg-transparent'
                            : isActive
                              ? 'bg-primary text-foreground-inverse'
                              : 'bg-bg-secondary text-foreground group-hover:bg-primary group-hover:text-foreground-inverse',
                        isActive
                            ? activeRoundedClass
                            : `${roundedClass} group-hover:${activeRoundedClass}`,
                    )}
                >
                    {shouldShowIcon ? (
                        <PausedAnimatedImage
                            alt={server.name}
                            className="h-full w-full object-cover"
                            decoding="async"
                            draggable="false"
                            loading="lazy"
                            paused={paused}
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
