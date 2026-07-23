import { Moon } from 'lucide-react';

import { Box } from '@/ui/components/layout/Box';
import type { PresenceStatus } from '@/types/presence';
import { cn } from '@/utils/cn';

export type UserStatus = PresenceStatus;

interface UserProfileStatusIndicatorProps {
    status: UserStatus;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

type IndicatorSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const STATUS_SIZE_CLASSES: Record<IndicatorSize, string> = {
    xs: 'w-2.5 h-2.5 border-[1.5px]',
    sm: 'w-2.5 h-2.5 border-[1.5px]',
    md: 'w-3 h-3 border-2',
    lg: 'w-4 h-4 border-2',
    xl: 'w-6 h-6 border-[3px]',
};

const IDLE_ICON_SIZE_PX: Record<IndicatorSize, number> = {
    xs: 9,
    sm: 9,
    md: 11,
    lg: 15,
    xl: 22,
};

const STATUS_COLOR_CLASSES: Record<UserStatus, string> = {
    online: 'bg-success',
    idle: 'bg-caution',
    dnd: 'bg-danger',
    offline: 'bg-muted-foreground',
};

const STATUS_LABELS: Record<UserStatus, string> = {
    online: 'Online',
    idle: 'Idle',
    dnd: 'Do Not Disturb',
    offline: 'Offline',
};

export const UserProfileStatusIndicator = ({
    status,
    size = 'md',
    className,
}: UserProfileStatusIndicatorProps) => {
    if (status === 'idle') {
        return (
            <Box
                className={cn(
                    'absolute -right-[1px] -bottom-[1px] z-20 flex items-center justify-center rounded-full border-background bg-background',
                    STATUS_SIZE_CLASSES[size],
                    className,
                )}
                title={STATUS_LABELS.idle}
            >
                <Moon
                    className="text-caution"
                    fill="currentColor"
                    size={IDLE_ICON_SIZE_PX[size]}
                />
            </Box>
        );
    }

    return (
        <Box
            className={cn(
                'absolute -right-[1px] -bottom-[1px] z-20 rounded-full border-background',
                STATUS_SIZE_CLASSES[size],
                STATUS_COLOR_CLASSES[status],
                className,
            )}
            title={STATUS_LABELS[status]}
        />
    );
};
