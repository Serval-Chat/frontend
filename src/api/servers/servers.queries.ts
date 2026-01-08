import { useQuery } from '@tanstack/react-query';

import { serversApi } from './servers.api';

export const SERVERS_QUERY_KEYS = {
    list: ['servers', 'list'] as const,
    details: (serverId: string) => ['servers', 'details', serverId] as const,
    channels: (serverId: string) => ['servers', 'channels', serverId] as const,
    categories: (serverId: string) =>
        ['servers', 'categories', serverId] as const,
    members: (serverId: string) => ['servers', 'members', serverId] as const,
    roles: (serverId: string) => ['servers', 'roles', serverId] as const,
};

export const useServers = () => {
    return useQuery({
        queryKey: SERVERS_QUERY_KEYS.list,
        queryFn: () => serversApi.getServers(),
    });
};

export const useServerDetails = (serverId: string | null) => {
    return useQuery({
        queryKey: serverId ? SERVERS_QUERY_KEYS.details(serverId) : [],
        queryFn: () => serversApi.getServerDetails(serverId!),
        enabled: !!serverId,
    });
};

export const useChannels = (serverId: string | null) => {
    return useQuery({
        queryKey: serverId ? SERVERS_QUERY_KEYS.channels(serverId) : [],
        queryFn: () => serversApi.getChannels(serverId!),
        enabled: !!serverId,
    });
};

export const useCategories = (serverId: string | null) => {
    return useQuery({
        queryKey: serverId ? SERVERS_QUERY_KEYS.categories(serverId) : [],
        queryFn: () => serversApi.getCategories(serverId!),
        enabled: !!serverId,
    });
};

export const useMembers = (serverId: string | null) => {
    return useQuery({
        queryKey: serverId ? SERVERS_QUERY_KEYS.members(serverId) : [],
        queryFn: () => serversApi.getMembers(serverId!),
        enabled: !!serverId,
    });
};

export const useRoles = (serverId: string | null) => {
    return useQuery({
        queryKey: serverId ? SERVERS_QUERY_KEYS.roles(serverId) : [],
        queryFn: () => serversApi.getRoles(serverId!),
        enabled: !!serverId,
    });
};
