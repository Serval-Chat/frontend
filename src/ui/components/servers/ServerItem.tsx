import React from 'react';

import type { Server } from '@/api/servers/servers.types';
import { cn } from '@/utils/cn';

import { ServerIcon } from './ServerIcon';

interface ServerItemProps {
    server: Server;
    isActive?: boolean;
    onClick?: () => void;
}

/**
 * @description A component representing a single server in the list.
 */
export const ServerItem: React.FC<ServerItemProps> = ({
    server,
    isActive,
    onClick,
}) => (
    <div className="relative group w-full flex items-center justify-center">
        {/* Active Indicator positioned at the far left of the nav bar */}
        <div
            className={cn(
                'absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-200',
                isActive ? 'h-10' : 'h-0 group-hover:h-5',
            )}
        />
        <ServerIcon isActive={isActive} server={server} onClick={onClick} />
    </div>
);
