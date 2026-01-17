import React from 'react';

import { cn } from '@/utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
}

/**
 * @description Shows preview of content when its still loading
 */
export const Skeleton: React.FC<SkeletonProps> = ({
    className,
    variant = 'rectangular',
    width,
    height,
    style,
    ...props
}) => (
    <div
        className={cn(
            'animate-pulse bg-white/5',
            {
                'rounded-md': variant === 'text' || variant === 'rectangular',
                'rounded-full': variant === 'circular',
                'h-4 w-full': variant === 'text' && !height,
            },
            className
        )}
        style={{
            width,
            height,
            ...style,
        }}
        {...props}
    />
);
