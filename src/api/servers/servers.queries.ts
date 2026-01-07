import { useQuery } from '@tanstack/react-query';
import { serversApi } from './servers.api';

export const SERVERS_QUERY_KEY = ['servers'] as const;

export const useServers = () => {
    return useQuery({
        queryKey: SERVERS_QUERY_KEY,
        queryFn: () => serversApi.getServers(),
    });
};
