import React from 'react';

import { cn } from '@/utils/cn';

interface BadgeProps {
    count: number;
    className?: string;
    maxCount?: number;
}

export const Badge: React.FC<BadgeProps> = ({
    count,
    className,
    maxCount = 99,
}) => {
    if (count <= 0) return null;

    const displayCount = count > maxCount ? `${maxCount}+` : count;

    return (
        <div
            className={cn(
                'absolute -bottom-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-lg bg-gradient-to-b from-red-500 to-red-600 px-1 text-[11px] font-bold text-white shadow-lg ring-[2.5px] ring-[var(--color-background)] transition-all duration-200 animate-in zoom-in',
                className,
            )}
        >
            {displayCount}
        </div>
    );
};
