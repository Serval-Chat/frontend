import React from 'react';

import { cn } from '@/utils/cn';

export type UserStatus = 'online' | 'offline';

interface UserProfileStatusIndicatorProps {
    status: UserStatus;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export const UserProfileStatusIndicator: React.FC<
    UserProfileStatusIndicatorProps
> = ({ status, size = 'md', className }) => {
    const sizeClasses = {
        sm: 'w-2.5 h-2.5 border-[1.5px]',
        md: 'w-3 h-3 border-2',
        lg: 'w-4 h-4 border-2',
        xl: 'w-6 h-6 border-[3px]',
    };

    return (
        <div
            className={cn(
                'rounded-full border-background absolute -bottom-[1px] -right-[1px]',
                sizeClasses[size],
                status === 'online' ? 'bg-success' : 'bg-muted-foreground',
                className
            )}
            title={status}
        />
    );
};
