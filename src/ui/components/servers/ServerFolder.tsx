import React, { useState } from 'react';

import {
    AnimatePresence,
    type DragControls,
    Reorder,
    motion,
} from 'framer-motion';
import {
    Edit2,
    Folder as FolderIcon,
    LayoutPanelLeft,
    Palette,
} from 'lucide-react';

import { useUpdateServerSettings } from '@/api/servers/servers.queries';
import type { Server } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import type { ServerFolder as IServerFolder } from '@/api/users/users.types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleFolder } from '@/store/slices/navSlice';
import {
    ContextMenu,
    type ContextMenuItem,
} from '@/ui/components/common/ContextMenu';
import { Tooltip } from '@/ui/components/common/Tooltip';
import { cn } from '@/utils/cn';

import { ServerIcon } from './ServerIcon';
import { ServerItem } from './ServerItem';
import { RenameFolderModal } from './modals/RenameFolderModal';

interface ServerFolderProps {
    folder: IServerFolder;
    servers: Server[];
    activeServerId?: string;
    unreadServers: Record<string, { hasUnread: boolean; pingCount: number }>;
    onServerClick: (serverId: string) => void;
    dragControls?: DragControls;
}

export const ServerFolder: React.FC<ServerFolderProps> = ({
    folder,
    servers,
    activeServerId,
    unreadServers,
    onServerClick,
    dragControls,
}) => {
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const { data: me } = useMe();
    const { mutate: updateSettings } = useUpdateServerSettings();
    const dispatch = useAppDispatch();
    const openedFolders = useAppSelector((state) => state.nav.openedFolders);
    const isOpen = openedFolders.includes(folder.id);

    const totalPings = React.useMemo(
        () =>
            folder.serverIds.reduce(
                (acc, id) => acc + (unreadServers[id]?.pingCount || 0),
                0,
            ),
        [folder.serverIds, unreadServers],
    );

    const hasUnread = React.useMemo(
        () => folder.serverIds.some((id) => unreadServers[id]?.hasUnread),
        [folder.serverIds, unreadServers],
    );
    const hasActiveServer = React.useMemo(
        () => folder.serverIds.some((id) => id === activeServerId),
        [folder.serverIds, activeServerId],
    );

    const folderServers = React.useMemo(
        () =>
            folder.serverIds
                .map((id) => servers.find((s) => s._id === id))
                .filter((s): s is Server => !!s),
        [servers, folder.serverIds],
    );

    const handleReorderServers = (newServers: Server[]): void => {
        if (!me) return;
        const newServerIds = newServers.map((s) => s._id);
        const currentOrder = me.serverSettings?.order || [];
        const newOrder = currentOrder.map((item) => {
            if (typeof item !== 'string' && item.id === folder.id) {
                return { ...item, serverIds: newServerIds };
            }
            return item;
        });

        updateSettings({ order: newOrder });
    };

    const handleToggleFolder = (): void => {
        dispatch(toggleFolder(folder.id));
    };

    const handleRenameFolder = (): void => {
        setIsRenameModalOpen(true);
    };

    const onRenameConfirm = (newName: string): void => {
        if (!me) return;

        const currentOrder = me.serverSettings?.order || [];
        const newOrder = currentOrder.map((item) => {
            if (typeof item !== 'string' && item.id === folder.id) {
                return { ...item, name: newName };
            }
            return item;
        });

        updateSettings({ order: newOrder });
    };

    const handleUngroupFolder = (): void => {
        if (!me) return;
        const currentOrder = me.serverSettings?.order || [];
        const folderIndex = currentOrder.findIndex(
            (item) => typeof item !== 'string' && item.id === folder.id,
        );
        if (folderIndex === -1) return;

        const newOrder = [...currentOrder];
        newOrder.splice(folderIndex, 1, ...folder.serverIds);

        updateSettings({ order: newOrder });
    };

    const handleSetColor = (color: string): void => {
        if (!me) return;
        const currentOrder = me.serverSettings?.order || [];
        const newOrder = currentOrder.map((item) => {
            if (typeof item !== 'string' && item.id === folder.id) {
                return { ...item, color };
            }
            return item;
        });

        updateSettings({ order: newOrder });
    };

    const contextMenuItems: ContextMenuItem[] = [
        {
            label: 'Rename Folder',
            icon: Edit2,
            onClick: handleRenameFolder,
        },
        {
            type: 'submenu',
            label: 'Set Color',
            icon: Palette,
            items: [
                { label: 'Blue', onClick: () => handleSetColor('#5865f2') },
                { label: 'Green', onClick: () => handleSetColor('#23a559') },
                { label: 'Yellow', onClick: () => handleSetColor('#fee75c') },
                { label: 'Fuchsia', onClick: () => handleSetColor('#eb459e') },
                { label: 'Red', onClick: () => handleSetColor('#ed4245') },
            ],
        },
        { type: 'divider' },
        {
            label: 'Ungroup Folder',
            icon: LayoutPanelLeft,
            onClick: handleUngroupFolder,
            variant: 'danger',
        },
    ];

    return (
        <div className="flex w-full flex-col items-center gap-2">
            <div className="group relative flex w-full items-center justify-center">
                <div
                    className={cn(
                        'absolute top-1/2 left-0 w-1 -translate-y-1/2 rounded-r-full bg-white transition-all duration-200',
                        hasActiveServer
                            ? 'h-10'
                            : hasUnread
                              ? 'h-5'
                              : 'h-0 group-hover:h-5',
                    )}
                />

                <ContextMenu items={contextMenuItems}>
                    <Tooltip content={folder.name}>
                        <motion.button
                            aria-expanded={isOpen}
                            aria-label={`Folder: ${folder.name}`}
                            className={cn(
                                'relative flex h-12 w-12 items-center justify-center bg-[--color-bg-subtle] transition-all duration-200 hover:rounded-[0.75rem]',
                                isOpen
                                    ? 'rounded-[0.75rem]'
                                    : 'rounded-[1.2rem]',
                            )}
                            style={{ backgroundColor: folder.color + '15' }} // ~8% opacity
                            onPointerDown={(e) => dragControls?.start(e)}
                            onTap={handleToggleFolder}
                        >
                            <div
                                className={cn(
                                    'absolute inset-0 flex items-center justify-center overflow-hidden transition-all duration-200',
                                    isOpen
                                        ? 'rounded-[0.75rem]'
                                        : 'rounded-[1.2rem]',
                                )}
                            >
                                {isOpen ? (
                                    <FolderIcon
                                        className="h-6 w-6"
                                        style={{
                                            color: folder.color,
                                            fill: folder.color,
                                        }}
                                    />
                                ) : (
                                    <div className="grid h-full w-full grid-cols-2 gap-1 p-1">
                                        {folderServers
                                            .slice(0, 4)
                                            .map((server) => (
                                                <ServerIcon
                                                    className="pointer-events-none !bg-transparent"
                                                    key={server._id}
                                                    server={server}
                                                    size="xxs"
                                                />
                                            ))}
                                    </div>
                                )}
                            </div>

                            {totalPings > 0 && (
                                <div className="absolute -right-1 -bottom-1 flex h-5 min-w-[20px] items-center justify-center rounded-lg bg-red-500 text-[11px] font-bold text-white ring-[2px] ring-background">
                                    {totalPings > 99 ? '99+' : totalPings}
                                </div>
                            )}
                        </motion.button>
                    </Tooltip>
                </ContextMenu>
            </div>

            <RenameFolderModal
                currentName={folder.name}
                isOpen={isRenameModalOpen}
                onClose={() => setIsRenameModalOpen(false)}
                onRename={onRenameConfirm}
            />

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        animate={{ height: 'auto', opacity: 1 }}
                        className="relative flex w-full flex-col items-center gap-2 overflow-hidden py-1.5"
                        exit={{ height: 0, opacity: 0 }}
                        initial={{ height: 0, opacity: 0 }}
                    >
                        <div
                            className="pointer-events-none absolute inset-y-0 left-1/2 w-14 -translate-x-1/2 rounded-2xl"
                            style={{ backgroundColor: folder.color + '15' }}
                        />

                        <Reorder.Group
                            axis="y"
                            className="flex w-full flex-col items-center gap-2"
                            values={folderServers}
                            onReorder={handleReorderServers}
                        >
                            {folderServers.map((server) => {
                                const unreadStatus = unreadServers[server._id];
                                return (
                                    <Reorder.Item
                                        className="w-full"
                                        key={server._id}
                                        value={server}
                                    >
                                        <ServerItem
                                            isActive={
                                                activeServerId === server._id
                                            }
                                            isUnread={unreadStatus?.hasUnread}
                                            pingCount={unreadStatus?.pingCount}
                                            server={server}
                                            onClick={() =>
                                                onServerClick(server._id)
                                            }
                                        />
                                    </Reorder.Item>
                                );
                            })}
                        </Reorder.Group>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
