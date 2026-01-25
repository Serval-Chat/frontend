import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import type { Emoji } from '@/api/emojis/emojis.types';

import { serversApi } from './servers.api';
import type {
    Category,
    Channel,
    Role,
    Server,
    ServerMember,
} from './servers.types';

export const SERVERS_QUERY_KEYS = {
    list: ['servers', 'list'] as const,
    details: (serverId: string | null) =>
        ['servers', 'details', serverId] as const,
    channels: (serverId: string | null) =>
        ['servers', 'channels', serverId] as const,
    categories: (serverId: string | null) =>
        ['servers', 'categories', serverId] as const,
    members: (serverId: string | null) =>
        ['servers', 'members', serverId] as const,
    roles: (serverId: string | null) => ['servers', 'roles', serverId] as const,
    emojis: (serverId: string | null) =>
        ['servers', 'emojis', serverId] as const,
};

export const useServers = (): UseQueryResult<Server[], Error> =>
    useQuery({
        queryKey: SERVERS_QUERY_KEYS.list,
        queryFn: () => serversApi.getServers(),
    });

export const useServerDetails = (
    serverId: string | null,
): UseQueryResult<Server, Error> =>
    useQuery({
        queryKey: SERVERS_QUERY_KEYS.details(serverId),
        queryFn: () => serversApi.getServerDetails(serverId!),
        enabled: !!serverId,
    });

export const useChannels = (
    serverId: string | null,
): UseQueryResult<Channel[], Error> =>
    useQuery({
        queryKey: SERVERS_QUERY_KEYS.channels(serverId),
        queryFn: () => serversApi.getChannels(serverId!),
        enabled: !!serverId,
    });

export const useCategories = (
    serverId: string | null,
): UseQueryResult<Category[], Error> =>
    useQuery({
        queryKey: SERVERS_QUERY_KEYS.categories(serverId),
        queryFn: () => serversApi.getCategories(serverId!),
        enabled: !!serverId,
    });

export const useMembers = (
    serverId: string | null,
): UseQueryResult<ServerMember[], Error> =>
    useQuery({
        queryKey: SERVERS_QUERY_KEYS.members(serverId),
        queryFn: () => serversApi.getMembers(serverId!),
        enabled: !!serverId,
    });

export const useRoles = (
    serverId: string | null,
): UseQueryResult<Role[], Error> =>
    useQuery({
        queryKey: SERVERS_QUERY_KEYS.roles(serverId),
        queryFn: () => serversApi.getRoles(serverId!),
        enabled: !!serverId,
    });

export const useServerEmojis = (
    serverId: string | null,
): UseQueryResult<Emoji[], Error> =>
    useQuery({
        queryKey: ['servers', 'emojis', serverId],
        queryFn: () => serversApi.getEmojis(serverId!),
        enabled: !!serverId,
    });
