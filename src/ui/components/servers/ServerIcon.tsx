import type { Server } from '@/api/servers/servers.types';
import { Badge } from '@/ui/components/common/Badge';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';

interface ServerIconProps {
    server: Omit<Server, '_id' | 'ownerId'> | Server;
    isActive?: boolean;
    onClick?: () => void;
    className?: string;
    size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    badgeCount?: number;
}

export const ServerIcon: React.FC<ServerIconProps> = ({
    server,
    isActive,
    onClick,
    className,
    size = 'md',
    badgeCount,
}) => {
    const iconUrl = resolveApiUrl(server.icon);

    const initials = server.name
        .split(' ')
        .map((word: string) => word[0])
        .join('')
        .slice(0, 3)
        .toUpperCase();

    const sizeClasses = {
        xxs: 'w-4 h-4 text-[7px]',
        xs: 'w-6 h-6 text-[9px]',
        sm: 'w-9 h-9 text-[10px]',
        md: 'w-12 h-12 text-sm',
        lg: 'w-16 h-16 text-lg',
        xl: 'w-20 h-20 text-xl',
    };

    const roundedClasses = {
        xxs: 'rounded-sm',
        xs: 'rounded-md',
        sm: 'rounded-[0.75rem]',
        md: 'rounded-[1.2rem]',
        lg: 'rounded-[1.5rem]',
        xl: 'rounded-[1.8rem]',
    };

    const activeRoundedClasses = {
        xxs: 'rounded-sm',
        xs: 'rounded-md',
        sm: 'rounded-lg',
        md: 'rounded-[0.75rem]',
        lg: 'rounded-xl',
        xl: 'rounded-2xl',
    };

    return (
        <div
            className={cn(
                'flex items-center justify-center transition-all duration-200 cursor-pointer group relative',
                isActive
                    ? `bg-[--color-primary] text-foreground-inverse`
                    : `bg-[--color-bg-subtle] text-foreground-muted hover:bg-[--color-primary] hover:text-foreground-inverse`,
                sizeClasses[size],
                className,
            )}
            role="button"
            tabIndex={0}
            title={server.name}
            onClick={onClick}
            onKeyDown={(e) => {
                if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                    onClick();
                }
            }}
        >
            <div
                className={cn(
                    'w-full h-full flex items-center justify-center overflow-hidden transition-all duration-200',
                    isActive
                        ? activeRoundedClasses[size]
                        : `${roundedClasses[size]} group-hover:${activeRoundedClasses[size]}`,
                )}
            >
                {iconUrl ? (
                    <img
                        alt={server.name}
                        className="w-full h-full object-cover"
                        src={iconUrl}
                    />
                ) : (
                    <span className="font-bold">{initials}</span>
                )}
            </div>
            {badgeCount !== undefined && badgeCount > 0 && (
                <Badge count={badgeCount} />
            )}
        </div>
    );
};
