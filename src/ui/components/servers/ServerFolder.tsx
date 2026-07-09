import React, { useState } from 'react';

import {
    AnimatePresence,
    type DragControls,
    Reorder,
    m,
    useDragControls,
} from 'framer-motion';
import {
    Check,
    Edit2,
    Folder as FolderIcon,
    LayoutPanelLeft,
    MoveVertical,
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

const CONTEXT_MENU_TAP_SUPPRESSION_MS = 2000;

interface ServerFolderProps {
    folder: IServerFolder;
    servers: Server[];
    activeServerId?: string;
    unreadServers: Record<string, { hasUnread: boolean; pingCount: number }>;
    onServerClick: (serverId: string) => void;
    dragControls?: DragControls;
    disableReorder?: boolean;
    onStartReorderFolder?: () => void;
    onStartReorderServer?: (serverId: string, folderId: string) => void;
    onConfirmServerPosition?: (folderId: string, index: number) => void;
    isMobileReordering?: boolean;
    pickedServerId?: string | null;
}

const FolderExpandedList = ({
    folder,
    folderServers,
    disableReorder,
    isMobileReordering,
    pickedServerId,
    activeServerId,
    unreadServers,
    onConfirmServerPosition,
    onServerClick,
    onStartReorderServer,
    onReorderServers,
}: {
    folder: IServerFolder;
    folderServers: Server[];
    disableReorder: boolean;
    isMobileReordering: boolean;
    pickedServerId: string | null;
    activeServerId?: string;
    unreadServers: Record<string, { hasUnread: boolean; pingCount: number }>;
    onConfirmServerPosition?: (folderId: string, index: number) => void;
    onServerClick: (serverId: string) => void;
    onStartReorderServer?: (serverId: string, folderId: string) => void;
    onReorderServers: (servers: Server[]) => void;
}) => (
    <m.div
        animate={{ height: 'auto', opacity: 1 }}
        className="relative flex w-full flex-col items-center gap-2 overflow-hidden py-1.5"
        exit={{ height: 0, opacity: 0 }}
        initial={{ height: 0, opacity: 0 }}
    >
        <div
            className="pointer-events-none absolute inset-y-0 left-1/2 w-14 -translate-x-1/2 rounded-2xl"
            style={{ backgroundColor: folder.color + '15' }}
        />

        {disableReorder ? (
            <div className="flex w-full touch-pan-y flex-col items-center gap-2">
                {isMobileReordering &&
                pickedServerId &&
                onConfirmServerPosition ? (
                    <MobileFolderDropTarget
                        onConfirm={(): void => {
                            onConfirmServerPosition(folder.id, 0);
                        }}
                    />
                ) : null}
                {folderServers.map((server, index) => {
                    const unreadStatus = unreadServers[server.id];
                    return (
                        <React.Fragment key={server.id}>
                            <div
                                className={cn(
                                    'w-full',
                                    pickedServerId === server.id &&
                                        'opacity-40',
                                )}
                            >
                                <ServerItem
                                    isActive={activeServerId === server.id}
                                    isUnread={unreadStatus?.hasUnread}
                                    pingCount={unreadStatus?.pingCount}
                                    server={server}
                                    onClick={(): void => {
                                        onServerClick(server.id);
                                    }}
                                    onStartReorder={
                                        onStartReorderServer
                                            ? (): void => {
                                                  onStartReorderServer(
                                                      server.id,
                                                      folder.id,
                                                  );
                                              }
                                            : undefined
                                    }
                                />
                            </div>
                            {isMobileReordering &&
                            pickedServerId &&
                            onConfirmServerPosition ? (
                                <MobileFolderDropTarget
                                    onConfirm={(): void => {
                                        onConfirmServerPosition(
                                            folder.id,
                                            index + 1,
                                        );
                                    }}
                                />
                            ) : null}
                        </React.Fragment>
                    );
                })}
            </div>
        ) : (
            <Reorder.Group
                axis="y"
                className="flex w-full flex-col items-center gap-2"
                values={folderServers}
                onReorder={onReorderServers}
            >
                {folderServers.map((server) => {
                    const unreadStatus = unreadServers[server.id];
                    return (
                        <FolderServerItem
                            isActive={activeServerId === server.id}
                            isUnread={unreadStatus?.hasUnread}
                            key={server.id}
                            pingCount={unreadStatus?.pingCount}
                            server={server}
                            onClick={(): void => {
                                onServerClick(server.id);
                            }}
                        />
                    );
                })}
            </Reorder.Group>
        )}
    </m.div>
);

export const ServerFolder = ({
    folder,
    servers,
    activeServerId,
    unreadServers,
    onServerClick,
    dragControls,
    disableReorder = false,
    onStartReorderFolder,
    onStartReorderServer,
    onConfirmServerPosition,
    isMobileReordering = false,
    pickedServerId = null,
}: ServerFolderProps) => {
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const suppressNextTapRef = React.useRef(false);
    const suppressTapTimeoutRef = React.useRef<ReturnType<
        typeof setTimeout
    > | null>(null);
    const { data: me } = useMe();
    const { mutate: updateSettings } = useUpdateServerSettings();
    const dispatch = useAppDispatch();
    const openedFolders = useAppSelector(
        (state): string[] => state.nav.openedFolders,
    );
    const isOpen = openedFolders.includes(folder.id);

    const totalPings = React.useMemo(
        (): number =>
            folder.serverIds.reduce(
                (acc, id): number => acc + (unreadServers[id]?.pingCount || 0),
                0,
            ),
        [folder.serverIds, unreadServers],
    );

    const hasUnread = React.useMemo(
        (): boolean =>
            folder.serverIds.some(
                (id): boolean => unreadServers[id]?.hasUnread ?? false,
            ),
        [folder.serverIds, unreadServers],
    );
    const hasActiveServer = React.useMemo(
        (): boolean =>
            activeServerId !== undefined &&
            folder.serverIds.includes(activeServerId),
        [folder.serverIds, activeServerId],
    );

    const folderServers = React.useMemo(
        (): Server[] =>
            folder.serverIds
                .map((id): Server | undefined =>
                    servers.find((s): boolean => s.id === id),
                )
                .filter((s): s is Server => !!s),
        [servers, folder.serverIds],
    );

    const handleReorderServers = (newServers: Server[]): void => {
        if (!me) return;
        const newServerIds = newServers.map((s): string => s.id);
        const currentOrder = me.serverSettings?.order || [];
        const newOrder = currentOrder.map((item): string | IServerFolder => {
            if (typeof item !== 'string' && item.id === folder.id) {
                return { ...item, serverIds: newServerIds };
            }
            return item;
        });

        updateSettings({ order: newOrder });
    };

    const handleToggleFolder = (): void => {
        if (suppressNextTapRef.current) {
            suppressNextTapRef.current = false;
            if (suppressTapTimeoutRef.current) {
                clearTimeout(suppressTapTimeoutRef.current);
                suppressTapTimeoutRef.current = null;
            }
            return;
        }

        dispatch(toggleFolder(folder.id));
    };

    React.useEffect(
        (): (() => void) => (): void => {
            if (suppressTapTimeoutRef.current) {
                clearTimeout(suppressTapTimeoutRef.current);
            }
        },
        [],
    );

    const suppressNextTap = React.useCallback((): void => {
        suppressNextTapRef.current = true;
        if (suppressTapTimeoutRef.current) {
            clearTimeout(suppressTapTimeoutRef.current);
        }
        suppressTapTimeoutRef.current = setTimeout((): void => {
            suppressNextTapRef.current = false;
            suppressTapTimeoutRef.current = null;
        }, CONTEXT_MENU_TAP_SUPPRESSION_MS);
    }, []);

    const handleContextMenuOpenChange = React.useCallback(
        (open: boolean): void => {
            if (open) suppressNextTap();
        },
        [suppressNextTap],
    );

    const handleRenameFolder = (): void => {
        setIsRenameModalOpen(true);
    };

    const onRenameConfirm = (newName: string): void => {
        if (!me) return;

        const currentOrder = me.serverSettings?.order || [];
        const newOrder = currentOrder.map((item): string | IServerFolder => {
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
            (item): boolean =>
                typeof item !== 'string' && item.id === folder.id,
        );
        if (folderIndex === -1) return;

        const newOrder = [...currentOrder];
        newOrder.splice(folderIndex, 1, ...folder.serverIds);

        updateSettings({ order: newOrder });
    };

    const handleSetColor = (color: string): void => {
        if (!me) return;
        const currentOrder = me.serverSettings?.order || [];
        const newOrder = currentOrder.map((item): string | IServerFolder => {
            if (typeof item !== 'string' && item.id === folder.id) {
                return { ...item, color };
            }
            return item;
        });

        updateSettings({ order: newOrder });
    };

    const contextMenuItems: ContextMenuItem[] = [
        ...(onStartReorderFolder
            ? [
                  {
                      label: 'Reorder Folder',
                      icon: MoveVertical,
                      onClick: (): void => {
                          suppressNextTap();
                          onStartReorderFolder();
                      },
                  } satisfies ContextMenuItem,
                  { type: 'divider' } satisfies ContextMenuItem,
              ]
            : []),
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
                {
                    label: 'Blue',
                    onClick: (): void => {
                        handleSetColor('#5865f2');
                    },
                },
                {
                    label: 'Green',
                    onClick: (): void => {
                        handleSetColor('#23a559');
                    },
                },
                {
                    label: 'Yellow',
                    onClick: (): void => {
                        handleSetColor('#fee75c');
                    },
                },
                {
                    label: 'Fuchsia',
                    onClick: (): void => {
                        handleSetColor('#eb459e');
                    },
                },
                {
                    label: 'Red',
                    onClick: (): void => {
                        handleSetColor('#ed4245');
                    },
                },
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

                <ContextMenu
                    items={contextMenuItems}
                    onOpenChange={handleContextMenuOpenChange}
                >
                    <Tooltip content={folder.name}>
                        <m.button
                            className={cn(
                                'relative flex h-12 w-12 items-center justify-center bg-[--color-bg-subtle] transition-all duration-200 select-none hover:rounded-[0.75rem]',
                                isOpen
                                    ? 'rounded-[0.75rem]'
                                    : 'rounded-[1.2rem]',
                            )}
                            style={{ backgroundColor: folder.color + '15' }} // ~8% opacity
                            onPointerDown={(e): void => {
                                if (
                                    disableReorder ||
                                    e.pointerType !== 'mouse' ||
                                    e.button !== 0
                                ) {
                                    return;
                                }

                                dragControls?.start(e);
                            }}
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
                                                    key={server.id}
                                                    server={server}
                                                    size="xxs"
                                                />
                                            ))}
                                    </div>
                                )}
                            </div>

                            {totalPings > 0 ? (
                                <div className="absolute -right-1 -bottom-1 flex h-5 min-w-[20px] items-center justify-center rounded-lg bg-red-500 text-[11px] font-bold text-white ring-[2px] ring-background">
                                    {totalPings > 99 ? '99+' : totalPings}
                                </div>
                            ) : null}
                        </m.button>
                    </Tooltip>
                </ContextMenu>
            </div>

            <RenameFolderModal
                currentName={folder.name}
                isOpen={isRenameModalOpen}
                onClose={(): void => {
                    setIsRenameModalOpen(false);
                }}
                onRename={onRenameConfirm}
            />

            <AnimatePresence>
                {isOpen ? (
                    <FolderExpandedList
                        activeServerId={activeServerId}
                        disableReorder={disableReorder}
                        folder={folder}
                        folderServers={folderServers}
                        isMobileReordering={isMobileReordering}
                        pickedServerId={pickedServerId}
                        unreadServers={unreadServers}
                        onConfirmServerPosition={onConfirmServerPosition}
                        onReorderServers={handleReorderServers}
                        onServerClick={onServerClick}
                        onStartReorderServer={onStartReorderServer}
                    />
                ) : null}
            </AnimatePresence>
        </div>
    );
};

const FolderServerItem = React.memo(
    ({
        server,
        isActive,
        isUnread,
        pingCount,
        onClick,
    }: {
        server: Server;
        isActive?: boolean;
        isUnread?: boolean;
        pingCount?: number;
        onClick: () => void;
    }) => {
        const dragControls = useDragControls();

        return (
            <Reorder.Item
                className="w-full"
                dragControls={dragControls}
                dragListener={false}
                value={server}
            >
                <div
                    className="w-full touch-pan-y select-none"
                    onPointerDown={(e): void => {
                        if (e.pointerType !== 'mouse' || e.button !== 0) {
                            return;
                        }

                        dragControls.start(e);
                    }}
                >
                    <ServerItem
                        isActive={isActive}
                        isUnread={isUnread}
                        pingCount={pingCount}
                        server={server}
                        onClick={onClick}
                    />
                </div>
            </Reorder.Item>
        );
    },
);

FolderServerItem.displayName = 'FolderServerItem';

const MobileFolderDropTarget = React.memo(
    ({ onConfirm }: { onConfirm: () => void }) => (
        <button
            aria-label="Place server here"
            className="relative z-[2] flex h-7 w-12 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-primary shadow-lg backdrop-blur-sm"
            type="button"
            onClick={onConfirm}
        >
            <Check className="h-4 w-4" />
        </button>
    ),
);

MobileFolderDropTarget.displayName = 'MobileFolderDropTarget';
