import React from 'react';

import { useServers } from '@/api/servers/servers.queries';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedServerId } from '@/store/slices/navSlice';

import { ServerItem } from './ServerItem';

/**
 * @description A component that fetches and lists the user's servers.
 */
export const ServerList: React.FC = () => {
    const { data: servers, isLoading } = useServers();
    const dispatch = useAppDispatch();
    const selectedServerId = useAppSelector(
        (state) => state.nav.selectedServerId,
    );
    const unreadServers = useAppSelector((state) => state.unread.unreadServers);

    return (
        <div className="flex-1 w-full flex flex-col items-center gap-3 overflow-y-auto no-scrollbar">
            {isLoading ? (
                <div className="w-12 h-12 rounded-[1.2rem] bg-white/5 animate-pulse" />
            ) : (
                servers?.map((server) => (
                    <ServerItem
                        isActive={selectedServerId === server._id}
                        isUnread={!!unreadServers[server._id]}
                        key={server._id}
                        server={server}
                        onClick={() =>
                            dispatch(setSelectedServerId(server._id))
                        }
                    />
                ))
            )}
        </div>
    );
};
