import React, { useState } from 'react';

import { Check, Settings } from 'lucide-react';

import { useMarkServerRead } from '@/api/servers/servers.queries';
import type { Server } from '@/api/servers/servers.types';
import { usePermissions } from '@/hooks/usePermissions';
import { ContextMenu } from '@/ui/components/common/ContextMenu';
import { cn } from '@/utils/cn';

import { ServerIcon } from './ServerIcon';
import { ServerSettingsModal } from './settings/ServerSettingsModal';

interface ServerItemProps {
    server: Server;
    isActive?: boolean;
    isUnread?: boolean;
    pingCount?: number;
    onClick?: () => void;
}

/**
 * @description A component representing a single server in the list with a context menu.
 */
export const ServerItem: React.FC<ServerItemProps> = ({
    server,
    isActive,
    isUnread,
    pingCount,
    onClick,
}) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { hasPermission, isOwner } = usePermissions(server._id);
    const { mutate: markAsRead } = useMarkServerRead();

    const canManageServer =
        isOwner ||
        hasPermission('manageServer') ||
        hasPermission('manageRoles') ||
        hasPermission('manageInvites');

    const contextMenuItems = [];

    if (isUnread || (pingCount && pingCount > 0)) {
        contextMenuItems.push({
            label: 'Mark as Read',
            icon: Check,
            onClick: () => markAsRead(server._id),
        });
    }

    if (canManageServer) {
        contextMenuItems.push({
            label: 'Server Settings',
            icon: Settings,
            onClick: () => setIsSettingsOpen(true),
        });
    }

    return (
        <>
            <div className="group relative flex w-full items-center justify-center">
                {/* Active / Unread indicator */}
                <div
                    className={cn(
                        'absolute top-1/2 left-0 w-1 -translate-y-1/2 rounded-r-full bg-white transition-all duration-200',
                        isActive
                            ? 'h-10'
                            : isUnread
                              ? 'h-5'
                              : 'h-0 group-hover:h-5',
                    )}
                />
                {contextMenuItems.length > 0 ? (
                    <ContextMenu items={contextMenuItems}>
                        <ServerIcon
                            badgeCount={pingCount}
                            isActive={isActive}
                            server={server}
                            onClick={onClick}
                        />
                    </ContextMenu>
                ) : (
                    <ServerIcon
                        isActive={isActive}
                        server={server}
                        onClick={onClick}
                    />
                )}
            </div>

            <ServerSettingsModal
                isOpen={isSettingsOpen}
                serverId={server._id}
                onClose={() => setIsSettingsOpen(false)}
            />
        </>
    );
};
