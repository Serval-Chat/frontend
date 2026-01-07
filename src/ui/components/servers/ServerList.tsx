import React from 'react';
import { useServers } from '@/api/servers/servers.queries';
import { ServerItem } from './ServerItem';

/**
 * @description A component that fetches and lists the user's servers.
 */
export const ServerList: React.FC = () => {
    const { data: servers, isLoading } = useServers();

    return (
        <div className="flex-1 w-full flex flex-col items-center gap-3 overflow-y-auto no-scrollbar">
            {isLoading ? (
                <div className="w-12 h-12 rounded-[1.2rem] bg-white/5 animate-pulse" />
            ) : (
                servers?.map((server) => (
                    <ServerItem key={server._id} server={server} />
                ))
            )}
        </div>
    );
};
