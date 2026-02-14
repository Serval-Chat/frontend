import React, { useState } from 'react';

import { Settings } from 'lucide-react';

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
    onClick?: () => void;
}

/**
 * @description A component representing a single server in the list with a context menu.
 */
export const ServerItem: React.FC<ServerItemProps> = ({
    server,
    isActive,
    isUnread,
    onClick,
}) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { hasPermission, isOwner } = usePermissions(server._id);

    const canManageServer =
        isOwner ||
        hasPermission('manageServer') ||
        hasPermission('manageRoles') ||
        hasPermission('manageInvites');

    const contextMenuItems = [];

    if (canManageServer) {
        contextMenuItems.push({
            label: 'Server Settings',
            icon: Settings,
            onClick: () => setIsSettingsOpen(true),
        });
    }

    return (
        <>
            <div className="relative group w-full flex items-center justify-center">
                {/* Active / Unread indicator */}
                <div
                    className={cn(
                        'absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-200',
                        isActive || isUnread ? 'h-10' : 'h-0 group-hover:h-5',
                    )}
                />
                {contextMenuItems.length > 0 ? (
                    <ContextMenu items={contextMenuItems}>
                        <ServerIcon
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
