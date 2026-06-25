import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

export type UserStatus = 'online' | 'offline';

interface UserProfileStatusIndicatorProps {
    status: UserStatus;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const STATUS_SIZE_CLASSES = {
    xs: 'w-2.5 h-2.5 border-[1.5px]',
    sm: 'w-2.5 h-2.5 border-[1.5px]',
    md: 'w-3 h-3 border-2',
    lg: 'w-4 h-4 border-2',
    xl: 'w-6 h-6 border-[3px]',
};

export const UserProfileStatusIndicator = ({
    status,
    size = 'md',
    className,
}: UserProfileStatusIndicatorProps) => (
    <Box
        className={cn(
            'absolute -right-[1px] -bottom-[1px] z-20 rounded-full border-background',
            STATUS_SIZE_CLASSES[size],
            status === 'online' ? 'bg-success' : 'bg-muted-foreground',
            className,
        )}
        title={status}
    />
);
