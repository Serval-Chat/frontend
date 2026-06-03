import React from 'react';

import { Reorder, useDragControls } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
    useServers,
    useUnreadStatus,
    useUpdateServerSettings,
} from '@/api/servers/servers.queries';
import type { Server } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import type { ServerFolder as IServerFolder } from '@/api/users/users.types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { openFolder } from '@/store/slices/navSlice';

import { ServerFolder } from './ServerFolder';
import { ServerItem } from './ServerItem';

type MobileReorderItem =
    | { type: 'server'; id: string; sourceFolderId?: string }
    | { type: 'folder'; id: string };

/**
 * @description A component that fetches servers and renders them + folders :3
 */
export const ServerList = () => {
    const { data: servers, isLoading } = useServers();
    const { data: me } = useMe();
    const { mutate: updateSettings } = useUpdateServerSettings();
    useUnreadStatus();
    const [disableReorder, setDisableReorder] = React.useState(
        (): boolean =>
            window.matchMedia('(pointer: coarse), (max-width: 767px)').matches,
    );
    const [mobileReorderItem, setMobileReorderItem] =
        React.useState<MobileReorderItem | null>(null);

    const selectedServerId = useAppSelector(
        (state): string | null => state.nav.selectedServerId,
    );
    const unreadServers = useAppSelector((state) => state.unread.unreadServers);
    const lastOpenedChannelByServer = useAppSelector(
        (state): Record<string, string> => state.nav.lastOpenedChannelByServer,
    );
    const openedFolders = useAppSelector(
        (state): string[] => state.nav.openedFolders,
    );
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    React.useEffect((): (() => void) => {
        const query = window.matchMedia(
            '(pointer: coarse), (max-width: 767px)',
        );
        const handleChange = (): void => setDisableReorder(query.matches);

        handleChange();
        query.addEventListener('change', handleChange);
        return (): void => query.removeEventListener('change', handleChange);
    }, []);

    // Auto-open folder if navigating to a server inside it
    React.useEffect((): void => {
        if (!selectedServerId || !me?.serverSettings?.order) return;

        // Find which folder contains this server
        const folderWithServer = me.serverSettings.order.find(
            (item): boolean =>
                typeof item !== 'string' &&
                item.serverIds.includes(selectedServerId),
        );

        if (folderWithServer && typeof folderWithServer !== 'string') {
            if (!openedFolders.includes(folderWithServer.id)) {
                dispatch(openFolder(folderWithServer.id));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedServerId, me?.serverSettings?.order, dispatch]);

    const orderedItems = React.useMemo((): (string | IServerFolder)[] => {
        if (!me || !servers) return [];

        const serverIds = servers.map((s): string => s.id);
        const savedOrder = me.serverSettings?.order || [];

        const filteredOrder = savedOrder.filter((item): boolean => {
            if (typeof item === 'string') {
                return serverIds.includes(item);
            }
            return true;
        });

        const orderedServerIds = new Set<string>();
        filteredOrder.forEach((item): void => {
            if (typeof item === 'string') {
                orderedServerIds.add(item);
            } else {
                item.serverIds.forEach(
                    (id): Set<string> => orderedServerIds.add(id),
                );
            }
        });

        const newServers = serverIds.filter(
            (id): boolean => !orderedServerIds.has(id),
        );

        return [...filteredOrder, ...newServers];
    }, [me, servers]);
    const [items, setItems] = React.useState<(string | IServerFolder)[]>([]);

    React.useEffect((): void => {
        setItems(orderedItems);
    }, [orderedItems]);

    const handleReorder = React.useCallback(
        (newItems: (string | IServerFolder)[]): void => {
            setItems(newItems);
        },
        [],
    );

    const handleDragEnd = React.useCallback((): void => {
        updateSettings({ order: items });
    }, [items, updateSettings]);

    const removePickedItem = React.useCallback(
        (
            order: (string | IServerFolder)[],
            picked: MobileReorderItem,
        ): (string | IServerFolder)[] =>
            order
                .map((item): string | IServerFolder | null => {
                    if (picked.type === 'folder') {
                        if (typeof item !== 'string' && item.id === picked.id) {
                            return null;
                        }
                        return item;
                    }

                    if (typeof item === 'string') {
                        return item === picked.id ? null : item;
                    }

                    return {
                        ...item,
                        serverIds: item.serverIds.filter(
                            (serverId): boolean => serverId !== picked.id,
                        ),
                    };
                })
                .filter(Boolean) as (string | IServerFolder)[],
        [],
    );

    const handleConfirmTopLevelPosition = React.useCallback(
        (index: number): void => {
            if (!mobileReorderItem) return;

            const picked =
                mobileReorderItem.type === 'folder'
                    ? items.find(
                          (item): item is IServerFolder =>
                              typeof item !== 'string' &&
                              item.id === mobileReorderItem.id,
                      )
                    : mobileReorderItem.id;

            if (!picked) return;

            const withoutPicked = removePickedItem(items, mobileReorderItem);
            const nextOrder = [...withoutPicked];
            nextOrder.splice(index, 0, picked);

            setItems(nextOrder);
            updateSettings({ order: nextOrder });
            setMobileReorderItem(null);
        },
        [items, mobileReorderItem, removePickedItem, updateSettings],
    );

    const handleConfirmFolderPosition = React.useCallback(
        (folderId: string, index: number): void => {
            if (!mobileReorderItem || mobileReorderItem.type !== 'server') {
                return;
            }

            const withoutPicked = removePickedItem(items, mobileReorderItem);
            const nextOrder = withoutPicked.map((item) => {
                if (typeof item === 'string' || item.id !== folderId) {
                    return item;
                }

                const nextServerIds = [...item.serverIds];
                nextServerIds.splice(index, 0, mobileReorderItem.id);
                return { ...item, serverIds: nextServerIds };
            });

            setItems(nextOrder);
            updateSettings({ order: nextOrder });
            setMobileReorderItem(null);
        },
        [items, mobileReorderItem, removePickedItem, updateSettings],
    );

    const handleServerClick = (serverId: string): void => {
        const lastChannelId = lastOpenedChannelByServer[serverId];
        const isMobile = window.innerWidth < 768;

        React.startTransition((): void => {
            if (!isMobile && lastChannelId) {
                void navigate(
                    `/chat/@server/${serverId}/channel/${lastChannelId}`,
                );
            } else {
                void navigate(`/chat/@server/${serverId}`);
            }
        });
    };

    if (isLoading || !servers) {
        return (
            <div className="no-scrollbar flex w-full flex-1 flex-col items-center gap-3 overflow-y-auto pt-3">
                <div className="h-12 w-12 animate-pulse rounded-[1.2rem] bg-white/5" />
                <div className="h-12 w-12 animate-pulse rounded-[1.2rem] bg-white/5" />
                <div className="h-12 w-12 animate-pulse rounded-[1.2rem] bg-white/5" />
            </div>
        );
    }

    const renderedItems = items.flatMap((item, index) => {
        const isFolder = typeof item !== 'string';
        const key = isFolder ? item.id : item;
        const mobileDropBefore =
            disableReorder && mobileReorderItem ? (
                <MobileTopLevelDropTarget
                    key={`drop-before-${key}`}
                    onConfirm={(): void => handleConfirmTopLevelPosition(index)}
                />
            ) : null;
        const mobileDropAfter =
            disableReorder &&
            mobileReorderItem &&
            index === items.length - 1 ? (
                <MobileTopLevelDropTarget
                    key="drop-after-last"
                    onConfirm={(): void =>
                        handleConfirmTopLevelPosition(items.length)
                    }
                />
            ) : null;

        if (isFolder) {
            const node = disableReorder ? (
                <div
                    className={`relative z-[1] w-full ${
                        mobileReorderItem?.type === 'folder' &&
                        mobileReorderItem.id === item.id
                            ? 'opacity-40'
                            : ''
                    }`}
                    key={key}
                >
                    <ServerFolder
                        disableReorder
                        activeServerId={selectedServerId ?? undefined}
                        folder={item}
                        isMobileReordering={!!mobileReorderItem}
                        pickedServerId={
                            mobileReorderItem?.type === 'server'
                                ? mobileReorderItem.id
                                : null
                        }
                        servers={servers}
                        unreadServers={unreadServers}
                        onConfirmServerPosition={handleConfirmFolderPosition}
                        onServerClick={handleServerClick}
                        onStartReorderFolder={(): void =>
                            setMobileReorderItem({
                                type: 'folder',
                                id: item.id,
                            })
                        }
                        onStartReorderServer={(
                            serverId,
                            sourceFolderId,
                        ): void =>
                            setMobileReorderItem({
                                type: 'server',
                                id: serverId,
                                sourceFolderId,
                            })
                        }
                    />
                </div>
            ) : (
                <ServerFolderWrapper
                    activeServerId={selectedServerId ?? undefined}
                    folder={item}
                    key={key}
                    servers={servers}
                    unreadServers={unreadServers}
                    onDragEnd={handleDragEnd}
                    onServerClick={handleServerClick}
                />
            );

            return [mobileDropBefore, node, mobileDropAfter].filter(Boolean);
        }

        const server = servers.find((s): boolean => s.id === item);
        if (!server) return null;

        const unreadStatus = unreadServers[server.id];

        const node = disableReorder ? (
            <div
                className={`relative z-[1] w-full ${
                    mobileReorderItem?.type === 'server' &&
                    mobileReorderItem.id === server.id
                        ? 'opacity-40'
                        : ''
                }`}
                key={key}
            >
                <ServerItem
                    isActive={selectedServerId === server.id}
                    isUnread={unreadStatus?.hasUnread}
                    pingCount={unreadStatus?.pingCount}
                    server={server}
                    onClick={(): void => handleServerClick(server.id)}
                    onStartReorder={(): void =>
                        setMobileReorderItem({
                            type: 'server',
                            id: server.id,
                        })
                    }
                />
            </div>
        ) : (
            <ServerItemWrapper
                isActive={selectedServerId === server.id}
                isUnread={unreadStatus?.hasUnread}
                key={key}
                pingCount={unreadStatus?.pingCount}
                server={server}
                onClick={(): void => handleServerClick(server.id)}
                onDragEnd={handleDragEnd}
            />
        );

        return [mobileDropBefore, node, mobileDropAfter].filter(Boolean);
    });

    if (disableReorder) {
        return (
            <div className="no-scrollbar flex w-full flex-1 touch-pan-y flex-col items-center gap-3 overflow-y-auto pt-3">
                {mobileReorderItem && (
                    <div className="sticky top-2 z-20 flex w-[60px] flex-col items-center gap-2 rounded-2xl border border-border-subtle bg-background/95 p-2 shadow-xl backdrop-blur">
                        <button
                            aria-label="Cancel server reorder"
                            className="text-foreground-muted flex h-10 w-10 items-center justify-center rounded-xl bg-bg-subtle"
                            type="button"
                            onClick={(): void => setMobileReorderItem(null)}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}
                {renderedItems}
            </div>
        );
    }

    return (
        <Reorder.Group
            axis="y"
            className="no-scrollbar flex w-full flex-1 flex-col items-center gap-3 overflow-y-auto pt-3"
            values={items}
            onReorder={handleReorder}
        >
            {renderedItems}
        </Reorder.Group>
    );
};

const ServerFolderWrapper = React.memo(
    (props: {
        folder: IServerFolder;
        servers: Server[];
        activeServerId?: string;
        unreadServers: Record<
            string,
            { hasUnread: boolean; pingCount: number }
        >;
        onDragEnd: () => void;
        onServerClick: (serverId: string) => void;
    }) => {
        const dragControls = useDragControls();

        return (
            <Reorder.Item
                layout
                className="relative z-[1] w-full"
                dragControls={dragControls}
                dragListener={false}
                transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8,
                }}
                value={props.folder}
                whileDrag={{
                    scale: 1.05,
                    zIndex: 10,
                }}
                onDragEnd={props.onDragEnd}
            >
                <ServerFolder
                    activeServerId={props.activeServerId}
                    dragControls={dragControls}
                    folder={props.folder}
                    servers={props.servers}
                    unreadServers={props.unreadServers}
                    onServerClick={props.onServerClick}
                />
            </Reorder.Item>
        );
    },
);

ServerFolderWrapper.displayName = 'ServerFolderWrapper';

const ServerItemWrapper = React.memo(
    (props: {
        server: Server;
        isActive: boolean;
        isUnread: boolean;
        pingCount?: number;
        onDragEnd: () => void;
        onClick: () => void;
    }) => {
        const dragControls = useDragControls();

        return (
            <Reorder.Item
                layout
                className="relative z-[1] w-full"
                dragControls={dragControls}
                dragListener={false}
                transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8,
                }}
                value={props.server.id}
                whileDrag={{
                    scale: 1.05,
                    zIndex: 10,
                }}
                onDragEnd={props.onDragEnd}
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
                        isActive={props.isActive}
                        isUnread={props.isUnread}
                        pingCount={props.pingCount}
                        server={props.server}
                        onClick={props.onClick}
                    />
                </div>
            </Reorder.Item>
        );
    },
);

ServerItemWrapper.displayName = 'ServerItemWrapper';

const MobileTopLevelDropTarget = React.memo(
    ({ onConfirm }: { onConfirm: () => void }) => (
        <button
            aria-label="Place item here"
            className="relative z-[2] flex h-8 w-14 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-primary shadow-lg backdrop-blur-sm"
            type="button"
            onClick={onConfirm}
        >
            <Check className="h-5 w-5" />
        </button>
    ),
);

MobileTopLevelDropTarget.displayName = 'MobileTopLevelDropTarget';
