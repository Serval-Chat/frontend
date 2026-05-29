import React from 'react';

import { Reorder, useDragControls } from 'framer-motion';
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

/**
 * @description A component that fetches servers and renders them + folders :3
 */
export const ServerList = () => {
    const { data: servers, isLoading } = useServers();
    const { data: me } = useMe();
    const { mutate: updateSettings } = useUpdateServerSettings();
    useUnreadStatus();

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

        const serverIds = servers.map((s): string => s._id);
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

    return (
        <Reorder.Group
            axis="y"
            className="no-scrollbar flex w-full flex-1 flex-col items-center gap-3 overflow-y-auto pt-3"
            values={items}
            onReorder={handleReorder}
        >
            {items.map((item) => {
                const isFolder = typeof item !== 'string';
                const key = isFolder ? item.id : item;

                if (isFolder) {
                    return (
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
                }

                const server = servers.find((s): boolean => s._id === item);
                if (!server) return null;

                const unreadStatus = unreadServers[server._id];

                return (
                    <ServerItemWrapper
                        isActive={selectedServerId === server._id}
                        isUnread={unreadStatus?.hasUnread}
                        key={key}
                        pingCount={unreadStatus?.pingCount}
                        server={server}
                        onClick={(): void => handleServerClick(server._id)}
                        onDragEnd={handleDragEnd}
                    />
                );
            })}
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
                value={props.server._id}
                whileDrag={{
                    scale: 1.05,
                    zIndex: 10,
                }}
                onDragEnd={props.onDragEnd}
            >
                <div
                    className="w-full select-none"
                    onPointerDown={(e): void => dragControls.start(e)}
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
