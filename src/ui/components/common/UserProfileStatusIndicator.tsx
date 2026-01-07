import React from 'react';

import { cn } from '@/utils/cn';

export type UserStatus = 'online' | 'offline';

interface UserProfileStatusIndicatorProps {
    status: UserStatus;
    className?: string;
}

export const UserProfileStatusIndicator: React.FC<
    UserProfileStatusIndicatorProps
> = ({ status, className }) => {
    return (
        <div
            className={cn(
                'w-3 h-3 rounded-full border-2 border-background absolute -bottom-[1px] -right-[1px]',
                status === 'online' ? 'bg-success' : 'bg-muted-foreground',
                className
            )}
            title={status}
        />
    );
};
