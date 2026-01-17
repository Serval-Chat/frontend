import React from 'react';

import type { Server } from '@/api/servers/servers.types';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';

interface ServerIconProps {
    server: Server;
    isActive?: boolean;
    onClick?: () => void;
}

export const ServerIcon: React.FC<ServerIconProps> = ({
    server,
    isActive,
    onClick,
}) => {
    const iconUrl = resolveApiUrl(server.icon);

    const initials = server.name
        .split(' ')
        .map((word: string) => word[0])
        .join('')
        .slice(0, 3)
        .toUpperCase();

    return (
        <div
            className={cn(
                'w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer overflow-hidden group relative',
                'bg-[--color-bg-subtle] text-foreground-muted hover:bg-[--color-primary] hover:text-foreground-inverse',
                isActive
                    ? 'rounded-[0.75rem] bg-[--color-primary] text-foreground-inverse'
                    : 'rounded-[1.2rem] hover:rounded-[0.75rem]'
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
            {iconUrl ? (
                <img
                    alt={server.name}
                    className="w-full h-full object-cover"
                    src={iconUrl}
                />
            ) : (
                <span className="text-sm font-bold">{initials}</span>
            )}
        </div>
    );
};
