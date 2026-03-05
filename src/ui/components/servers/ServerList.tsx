import React from 'react';

import { useNavigate } from 'react-router-dom';

import { useServers } from '@/api/servers/servers.queries';
import { useAppSelector } from '@/store/hooks';

import { ServerItem } from './ServerItem';

/**
 * @description A component that fetches and lists the user's servers.
 */
export const ServerList: React.FC = () => {
    const { data: servers, isLoading } = useServers();
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
                        onClick={() => handleServerClick(server._id)}
                    />
                ))
            )}
        </div>
    );
};
