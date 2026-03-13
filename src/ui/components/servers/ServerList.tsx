import React from 'react';

import { useNavigate } from 'react-router-dom';

import { useServers, useUnreadStatus } from '@/api/servers/servers.queries';
import { useAppSelector } from '@/store/hooks';

import { ServerItem } from './ServerItem';

/**
 * @description A component that fetches and lists the user's servers.
 */
export const ServerList: React.FC = () => {
    const { data: servers, isLoading } = useServers();
    useUnreadStatus();
    const selectedServerId = useAppSelector(
        (state) => state.nav.selectedServerId,
    );
    const unreadServers = useAppSelector((state) => state.unread.unreadServers);
    const lastOpenedChannelByServer = useAppSelector(
        (state) => state.nav.lastOpenedChannelByServer,
    );
    const navigate = useNavigate();

    const handleServerClick = (serverId: string): void => {
        const lastChannelId = lastOpenedChannelByServer[serverId];
        const isMobile = window.innerWidth < 768; // md breakpoint

        if (!isMobile && lastChannelId) {
            void navigate(`/chat/@server/${serverId}/channel/${lastChannelId}`);
        } else {
            void navigate(`/chat/@server/${serverId}`);
        }
    };

    return (
        <div className="no-scrollbar flex w-full flex-1 flex-col items-center gap-3 overflow-y-auto">
            {isLoading ? (
                <div className="h-12 w-12 animate-pulse rounded-[1.2rem] bg-white/5" />
            ) : (
                servers?.map((server) => {
                    const unreadStatus = unreadServers[server._id];
                    return (
                        <ServerItem
                            isActive={selectedServerId === server._id}
                            isUnread={unreadStatus?.hasUnread}
                            key={server._id}
                            pingCount={unreadStatus?.pingCount}
                            server={server}
                            onClick={() => handleServerClick(server._id)}
                        />
                    );
                })
            )}
        </div>
    );
};
