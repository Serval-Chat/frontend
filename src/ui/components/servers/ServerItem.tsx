import React, { useState } from 'react';

import { Check, FolderInput, FolderPlus, LogOut, Settings } from 'lucide-react';

import { useMarkServerRead } from '@/api/servers/servers.queries';
import { useUpdateServerSettings } from '@/api/servers/servers.queries';
import type { Server } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import type { ServerFolder as IServerFolder } from '@/api/users/users.types';
import { usePermissions } from '@/hooks/usePermissions';
import {
    ContextMenu,
    type ContextMenuItem,
} from '@/ui/components/common/ContextMenu';
import { Tooltip } from '@/ui/components/common/Tooltip';
import { cn } from '@/utils/cn';

import { ServerIcon } from './ServerIcon';
import { LeaveServerModal } from './modals/LeaveServerModal';
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
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const { hasPermission, isOwner } = usePermissions(server._id, null, {
        enabled: isActive,
    });
    const { mutate: markAsRead } = useMarkServerRead();
    const { data: me } = useMe();
    const { mutate: updateSettings } = useUpdateServerSettings();

    // The owner check is instant off the cache. The role-based permissions will only resolve if the server is actively selected.
    const canManageServer =
        isOwner ||
        hasPermission('manageServer') ||
        hasPermission('manageRoles') ||
        hasPermission('manageInvites');

    const contextMenuItems: ContextMenuItem[] = [];

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

    const folders =
        me?.serverSettings?.order.filter(
            (item): item is IServerFolder => typeof item !== 'string',
        ) || [];

    const handleCreateFolder = (): void => {
        if (!me) return;
        const currentOrder = me.serverSettings?.order || [];
        const newFolderId = Math.random().toString(36).substring(2, 9);
        const newFolder: IServerFolder = {
            id: newFolderId,
            name: 'New Folder',
            color: '#5865f2',
            serverIds: [server._id],
        };

        const newOrder = currentOrder.filter((id) => id !== server._id);
        const serverIndex = currentOrder.indexOf(server._id);
        if (serverIndex !== -1) {
            newOrder.splice(serverIndex, 0, newFolder);
        } else {
            newOrder.push(newFolder);
        }

        updateSettings({ order: newOrder });
    };

    const handleAddToFolder = (folderId: string): void => {
        if (!me) return;
        const currentOrder = me.serverSettings?.order || [];
        const newOrder = currentOrder
            .map((item) => {
                if (typeof item === 'string') {
                    if (item === server._id) return null;
                    return item;
                }
                if (item.id === folderId) {
                    if (item.serverIds.includes(server._id)) return item;
                    return {
                        ...item,
                        serverIds: [...item.serverIds, server._id],
                    };
                }
                return item;
            })
            .filter(Boolean) as (string | IServerFolder)[];

        updateSettings({ order: newOrder });
    };

    contextMenuItems.push({ type: 'divider' });
    contextMenuItems.push({
        label: 'Create Folder',
        icon: FolderPlus,
        onClick: handleCreateFolder,
    });

    if (folders.length > 0) {
        contextMenuItems.push({
            type: 'submenu',
            label: 'Add to Folder',
            icon: FolderInput,
            items: folders.map((f) => ({
                label: f.name,
                onClick: () => handleAddToFolder(f.id),
            })),
        });
    }

    if (!isOwner) {
        contextMenuItems.push({ type: 'divider' });
        contextMenuItems.push({
            label: 'Leave Server',
            icon: LogOut,
            variant: 'danger',
            onClick: () => setIsLeaveModalOpen(true),
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
                        <Tooltip content={server.name}>
                            <ServerIcon
                                badgeCount={pingCount}
                                isActive={isActive}
                                server={server}
                                onClick={onClick}
                            />
                        </Tooltip>
                    </ContextMenu>
                ) : (
                    <Tooltip content={server.name}>
                        <ServerIcon
                            isActive={isActive}
                            server={server}
                            onClick={onClick}
                        />
                    </Tooltip>
                )}
            </div>

            <ServerSettingsModal
                isOpen={isSettingsOpen}
                serverId={server._id}
                onClose={() => setIsSettingsOpen(false)}
            />

            <LeaveServerModal
                isOpen={isLeaveModalOpen}
                serverId={server._id}
                serverName={server.name}
                onClose={() => setIsLeaveModalOpen(false)}
            />
        </>
    );
};
