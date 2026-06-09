import { useEffect } from 'react';

import {
    type UseMutationResult,
    type UseQueryResult,
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { apiClient } from '@/api/client';
import type { Emoji } from '@/api/emojis/emojis.types';
import type { ServerSettings, User } from '@/api/users/users.types';
import { setUnreadServers } from '@/store/slices/unreadSlice';
import { setVoiceParticipants } from '@/store/slices/voiceSlice';
import { useToast } from '@/ui/components/common/Toast';
import { hasAuthToken } from '@/utils/authToken';
import { extractApiError } from '@/utils/extractApiError';

import { serversApi } from './servers.api';
import type { Sticker } from './servers.api';
import type {
    Category,
    Channel,
    DiscoveryServersResponse,
    Role,
    RolePermissions,
    Server,
    ServerBan,
    ServerDiscoveryStatus,
    ServerMember,
    ServerOnboardingSettings,
    ServerOnboardingState,
} from './servers.types';

const isValidId = (id: string | null | undefined): boolean => {
    if (!id) return false;
    if (id === 'preview') return true;
    return /^[a-f\d]{24}$/i.test(id);
};

const discoveryRecentCache = new Map<string, DiscoveryServersResponse>();
const DISCOVERY_RECENT_CACHE_LIMIT = 10;

const getDiscoveryCacheKey = (params: {
    q?: string;
    tags?: string[];
    limit?: number;
    cursor?: string;
}): string =>
    JSON.stringify({
        q: params.q?.trim().toLowerCase() ?? '',
        tags: [...(params.tags ?? [])]
            .map((tag): string => tag.toLowerCase())
            .sort(),
        limit: params.limit ?? 20,
        cursor: params.cursor ?? '',
    });

const rememberDiscoveryResult = (
    key: string,
    result: DiscoveryServersResponse,
): DiscoveryServersResponse => {
    discoveryRecentCache.delete(key);
    discoveryRecentCache.set(key, result);
    while (discoveryRecentCache.size > DISCOVERY_RECENT_CACHE_LIMIT) {
        const oldest = discoveryRecentCache.keys().next().value;
        if (oldest === undefined) break;
        discoveryRecentCache.delete(oldest);
    }
    return result;
};

export const SERVERS_QUERY_KEYS = {
    list: ['servers', 'list'] as const,
    unread: (): readonly ['servers', 'unread'] =>
        ['servers', 'unread'] as const,
    details: (
        serverId: string | null,
    ): readonly ['servers', 'details', string | null] =>
        ['servers', 'details', serverId] as const,
    channels: (
        serverId: string | null,
    ): readonly ['servers', 'channels', string | null] =>
        ['servers', 'channels', serverId] as const,
    categories: (
        serverId: string | null,
    ): readonly ['servers', 'categories', string | null] =>
        ['servers', 'categories', serverId] as const,
    members: (
        serverId: string | null,
    ): readonly ['servers', 'members', string | null] =>
        ['servers', 'members', serverId] as const,
    roles: (
        serverId: string | null,
    ): readonly ['servers', 'roles', string | null] =>
        ['servers', 'roles', serverId] as const,
    onboardingSettings: (
        serverId: string | null,
    ): readonly ['servers', 'onboarding-settings', string | null] =>
        ['servers', 'onboarding-settings', serverId] as const,
    onboarding: (
        serverId: string | null,
    ): readonly ['servers', 'onboarding', string | null] =>
        ['servers', 'onboarding', serverId] as const,
    emojis: (
        serverId: string | null,
    ): readonly ['servers', 'emojis', string | null] =>
        ['servers', 'emojis', serverId] as const,
    stickers: (
        serverId: string | null,
    ): readonly ['servers', 'stickers', string | null] =>
        ['servers', 'stickers', serverId] as const,
    discovery: (
        cacheKey: string,
        params: {
            q?: string;
            tags?: string[];
            limit?: number;
            cursor?: string;
        },
    ) => ['servers', 'discovery', cacheKey, params] as const,
    discoveryStatus: (
        serverId: string | null,
    ): readonly ['servers', 'discovery-status', string | null] =>
        ['servers', 'discovery-status', serverId] as const,
    bans: (
        serverId: string | null,
    ): readonly ['servers', 'bans', string | null] =>
        ['servers', 'bans', serverId] as const,
    voiceStates: (
        serverId: string | null,
    ): readonly ['servers', 'voice-states', string | null] =>
        ['servers', 'voice-states', serverId] as const,
};

export const useDiscoveryServers = (params: {
    q?: string;
    tags?: string[];
    limit?: number;
    cursor?: string;
}): UseQueryResult<DiscoveryServersResponse, Error> => {
    const cacheKey = getDiscoveryCacheKey(params);
    return useQuery({
        queryKey: SERVERS_QUERY_KEYS.discovery(cacheKey, params),
        queryFn: async (): Promise<DiscoveryServersResponse> => {
            const result = await serversApi.searchDiscoveryServers(params);
            return rememberDiscoveryResult(cacheKey, result);
        },
        enabled: hasAuthToken(),
        placeholderData: discoveryRecentCache.get(cacheKey),
        staleTime: 30_000,
    });
};

export const useServerDiscoveryStatus = (
    serverId: string | null,
): UseQueryResult<ServerDiscoveryStatus, Error> =>
    useQuery({
        queryKey: SERVERS_QUERY_KEYS.discoveryStatus(serverId),
        queryFn: (): Promise<ServerDiscoveryStatus> =>
            serversApi.getDiscoveryStatus(serverId!),
        enabled: !!serverId && isValidId(serverId) && hasAuthToken(),
    });

export const useServers = (): UseQueryResult<Server[], Error> => {
    const queryClient = useQueryClient();
    return useQuery({
        queryKey: SERVERS_QUERY_KEYS.list,
        queryFn: async (): Promise<Server[]> => {
            const servers = await serversApi.getServers();
            for (const server of servers) {
                queryClient.setQueryData(
                    SERVERS_QUERY_KEYS.details(server.id),
                    server,
                );
            }
            return servers;
        },
        enabled: hasAuthToken(),
    });
};

export const useUnreadStatus = (): UseQueryResult<
    Record<string, { hasUnread: boolean; pingCount: number }>,
    Error
> => {
    const dispatch = useDispatch();
    const query = useQuery({
        queryKey: SERVERS_QUERY_KEYS.unread(),
        queryFn: (): Promise<
            Record<string, { hasUnread: boolean; pingCount: number }>
        > => serversApi.getUnreadStatus(),
        enabled: hasAuthToken(),
    });

    useEffect((): void => {
        if (query.data) {
            dispatch(setUnreadServers(query.data));
        }
    }, [query.data, dispatch]);

    return query;
};

export const useExportChannelState = (
    serverId: string,
    channelId: string,
): UseQueryResult<
    {
        state: 'available' | 'in_progress' | 'cooling_down';
        lastExportAt?: string;
        nextExportAt?: string;
    },
    Error
> =>
    useQuery({
        queryKey: ['servers', 'export_state', serverId, channelId],
        queryFn: () => serversApi.getExportState(serverId, channelId),
        enabled: !!serverId && !!channelId,
        refetchInterval: (query): false | 10000 =>
            query.state.data?.state === 'in_progress' ? 10000 : false,
    });

export const useRequestExportChannel = (
    serverId: string,
    channelId: string,
): UseMutationResult<{ message: string; jobId: string }, Error, void> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (): Promise<{ message: string; jobId: string }> =>
            serversApi.requestExport(serverId, channelId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: ['servers', 'export_state', serverId, channelId],
            });
            showToast('Export requested successfully', 'success');
        },
        onError: (error): void => {
            showToast(
                extractApiError(error, 'Failed to request export'),
                'error',
            );
        },
    });
};

export const useCreateServer = (): UseMutationResult<
    { server: Server; channel: Channel },
    Error,
    { name: string; icon?: File }
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: ({
            name,
            icon,
        }): Promise<{ server: Server; channel: Channel }> =>
            serversApi.createServer(name, icon),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.list,
            });
            showToast('Server created successfully', 'success');
        },
        onError: (error): void => {
            showToast(
                extractApiError(error, 'Failed to create server'),
                'error',
            );
        },
    });
};

export const useJoinServer = (): UseMutationResult<
    { serverId: string },
    Error,
    string
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (inviteCode): Promise<{ serverId: string }> =>
            serversApi.joinServer(inviteCode),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.list,
            });
            showToast('Joined server successfully', 'success');
        },
        onError: (error): void => {
            showToast(extractApiError(error, 'Failed to join server'), 'error');
        },
    });
};

export const useServerDetails = (
    serverId: string | null,
    options: { enabled?: boolean } = {},
): UseQueryResult<Server, Error> =>
    useQuery({
        queryKey: SERVERS_QUERY_KEYS.details(serverId),
        queryFn: (): Promise<Server> => serversApi.getServerDetails(serverId!),
        enabled:
            (options.enabled ?? true) &&
            !!serverId &&
            isValidId(serverId) &&
            hasAuthToken(),
        placeholderData: keepPreviousData,
    });

export const useChannels = (
    serverId: string | null,
    options: { enabled?: boolean } = {},
): UseQueryResult<Channel[], Error> =>
    useQuery({
        queryKey: SERVERS_QUERY_KEYS.channels(serverId),
        queryFn: (): Promise<Channel[]> => serversApi.getChannels(serverId!),
        enabled:
            (options.enabled ?? true) &&
            !!serverId &&
            isValidId(serverId) &&
            hasAuthToken(),
        placeholderData: keepPreviousData,
    });

export const useCategories = (
    serverId: string | null,
    options: { enabled?: boolean } = {},
): UseQueryResult<Category[], Error> =>
    useQuery({
        queryKey: SERVERS_QUERY_KEYS.categories(serverId),
        queryFn: (): Promise<Category[]> => serversApi.getCategories(serverId!),
        enabled:
            (options.enabled ?? true) &&
            !!serverId &&
            isValidId(serverId) &&
            hasAuthToken(),
        placeholderData: keepPreviousData,
    });

export const useMembers = (
    serverId: string | null,
    options: { enabled?: boolean } = {},
): UseQueryResult<ServerMember[], Error> =>
    useQuery({
        queryKey: SERVERS_QUERY_KEYS.members(serverId),
        queryFn: (): Promise<ServerMember[]> =>
            serversApi.getMembers(serverId!),
        enabled:
            (options.enabled ?? true) &&
            !!serverId &&
            isValidId(serverId) &&
            hasAuthToken(),
        placeholderData: keepPreviousData,
    });

export const useRoles = (
    serverId: string | null,
    options: { enabled?: boolean } = {},
): UseQueryResult<Role[], Error> =>
    useQuery({
        queryKey: SERVERS_QUERY_KEYS.roles(serverId),
        queryFn: (): Promise<Role[]> => serversApi.getRoles(serverId!),
        enabled:
            (options.enabled ?? true) &&
            !!serverId &&
            isValidId(serverId) &&
            hasAuthToken(),
        placeholderData: keepPreviousData,
    });

export const useOnboardingSettings = (
    serverId: string | null,
    options: { enabled?: boolean } = {},
): UseQueryResult<ServerOnboardingSettings, Error> =>
    useQuery({
        queryKey: SERVERS_QUERY_KEYS.onboardingSettings(serverId),
        queryFn: (): Promise<ServerOnboardingSettings> =>
            serversApi.getOnboardingSettings(serverId!),
        enabled:
            (options.enabled ?? true) &&
            !!serverId &&
            isValidId(serverId) &&
            hasAuthToken(),
        placeholderData: keepPreviousData,
    });

export const useUpdateOnboardingSettings = (
    serverId: string,
): UseMutationResult<
    ServerOnboardingSettings,
    Error,
    Partial<ServerOnboardingSettings>
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (
            updates: Partial<ServerOnboardingSettings>,
        ): Promise<ServerOnboardingSettings> =>
            serversApi.updateOnboardingSettings(serverId, updates),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.onboardingSettings(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.details(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.onboarding(serverId),
            });
        },
    });
};

export const useOnboarding = (
    serverId: string | null,
    options: { enabled?: boolean } = {},
): UseQueryResult<ServerOnboardingState, Error> =>
    useQuery({
        queryKey: SERVERS_QUERY_KEYS.onboarding(serverId),
        queryFn: (): Promise<ServerOnboardingState> =>
            serversApi.getOnboarding(serverId!),
        enabled:
            (options.enabled ?? true) &&
            !!serverId &&
            isValidId(serverId) &&
            hasAuthToken(),
        placeholderData: keepPreviousData,
    });

export const useAcceptOnboardingRules = (
    serverId: string,
): UseMutationResult<ServerMember, Error, void> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (): Promise<ServerMember> =>
            serversApi.acceptOnboardingRules(serverId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.onboarding(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.members(serverId),
            });
        },
    });
};

export const useUpdateSelfRoles = (
    serverId: string,
): UseMutationResult<ServerMember, Error, string[]> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (roleIds: string[]): Promise<ServerMember> =>
            serversApi.updateSelfRoles(serverId, roleIds),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.onboarding(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.members(serverId),
            });
        },
    });
};

export const useUpdateChannelPreferences = (
    serverId: string,
): UseMutationResult<
    ServerMember,
    Error,
    { hiddenChannelIds: string[]; hiddenCategoryIds: string[] }
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (preferences): Promise<ServerMember> =>
            serversApi.updateChannelPreferences(serverId, preferences),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.onboarding(serverId),
            });
        },
    });
};

export const useCompleteOnboarding = (
    serverId: string,
): UseMutationResult<ServerMember, Error, void> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (): Promise<ServerMember> =>
            serversApi.completeOnboarding(serverId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.onboarding(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.members(serverId),
            });
        },
    });
};

export const useServerEmojis = (
    serverId: string | null,
): UseQueryResult<Emoji[], Error> =>
    useQuery({
        queryKey: SERVERS_QUERY_KEYS.emojis(serverId),
        queryFn: (): Promise<Emoji[]> => serversApi.getEmojis(serverId!),
        enabled: !!serverId && hasAuthToken(),
    });

export const useAllServerEmojis = (options?: {
    enabled?: boolean;
}): UseQueryResult<Emoji[], Error> =>
    useQuery({
        queryKey: ['servers', 'emojis', 'all'],
        queryFn: (): Promise<Emoji[]> => serversApi.getAllServerEmojis(),
        enabled: options?.enabled ?? true,
        staleTime: Infinity, // Emojis are static
    });

export const useUploadEmoji = (
    serverId: string,
): UseMutationResult<Emoji, Error, { name: string; file: File }> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: ({ name, file }): Promise<Emoji> =>
            serversApi.uploadEmoji(serverId, name, file),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.emojis(serverId),
            });
            showToast('Emoji uploaded successfully', 'success');
        },
        onError: (error): void => {
            showToast(
                extractApiError(error, 'Failed to upload emoji'),
                'error',
            );
        },
    });
};

export const useDeleteEmoji = (
    serverId: string,
): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (emojiId: string): Promise<void> =>
            serversApi.deleteEmoji(serverId, emojiId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.emojis(serverId),
            });
            showToast('Emoji deleted successfully', 'success');
        },
        onError: (error): void => {
            showToast(
                extractApiError(error, 'Failed to delete emoji'),
                'error',
            );
        },
    });
};

export const useServerStickers = (
    serverId: string | null,
): UseQueryResult<Sticker[], Error> =>
    useQuery({
        queryKey: SERVERS_QUERY_KEYS.stickers(serverId),
        queryFn: (): Promise<Sticker[]> => serversApi.getStickers(serverId!),
        enabled: !!serverId && hasAuthToken(),
    });

export const useAllStickers = (options?: {
    enabled?: boolean;
}): UseQueryResult<Sticker[], Error> =>
    useQuery({
        queryKey: ['stickers', 'all'],
        queryFn: (): Promise<Sticker[]> => serversApi.getAllStickers(),
        enabled: options?.enabled ?? true,
    });

export const useUploadSticker = (
    serverId: string,
): UseMutationResult<Sticker, Error, { name: string; file: File }> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: ({ name, file }): Promise<Sticker> =>
            serversApi.uploadSticker(serverId, name, file),
        onSuccess: (newSticker): void => {
            queryClient.setQueryData<Sticker[]>(
                SERVERS_QUERY_KEYS.stickers(serverId),
                (oldStickers): Sticker[] => {
                    if (!oldStickers) return [newSticker];
                    const exists = oldStickers.some(
                        (s): boolean => s.id === newSticker.id,
                    );
                    if (exists) return oldStickers;
                    return [...oldStickers, newSticker];
                },
            );
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.stickers(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: ['stickers', 'all'],
            });
            showToast('Sticker uploaded successfully', 'success');
        },
        onError: (error): void => {
            showToast(
                extractApiError(error, 'Failed to upload sticker'),
                'error',
            );
        },
    });
};

export const useDeleteSticker = (
    serverId: string,
): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (stickerId: string): Promise<void> =>
            serversApi.deleteSticker(serverId, stickerId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.stickers(serverId),
            });
            showToast('Sticker deleted successfully', 'success');
        },
        onError: (error): void => {
            showToast(
                extractApiError(error, 'Failed to delete sticker'),
                'error',
            );
        },
    });
};

export const useSticker = (
    stickerId: string | null,
): UseQueryResult<Sticker, Error> =>
    useQuery({
        queryKey: ['stickers', stickerId],
        queryFn: async (): Promise<Sticker> => {
            const response = await apiClient.get<Sticker>(
                `/api/v1/stickers/${stickerId}`,
            );
            return response.data;
        },
        enabled: !!stickerId && hasAuthToken(),
    });

export const useUpdateServer = (
    serverId: string,
): UseMutationResult<Server, Error, Partial<Server>> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (updates: Partial<Server>): Promise<Server> =>
            serversApi.updateServer(serverId, updates),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.details(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.list,
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.discoveryStatus(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: ['servers', 'discovery'],
            });
        },
    });
};

export const useUpdateServerIcon = (
    serverId: string,
): UseMutationResult<string, Error, File> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (icon: File): Promise<string> =>
            serversApi.uploadServerIcon(serverId, icon),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.details(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.list,
            });
        },
    });
};

export const useUpdateServerBanner = (
    serverId: string,
): UseMutationResult<string, Error, File> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (banner: File): Promise<string> =>
            serversApi.uploadServerBanner(serverId, banner),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.details(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.list,
            });
        },
    });
};

export const useVoiceStates = (
    serverId: string | null,
): UseQueryResult<Record<string, string[]>, Error> => {
    const dispatch = useDispatch();
    const query = useQuery({
        queryKey: SERVERS_QUERY_KEYS.voiceStates(serverId),
        queryFn: (): Promise<Record<string, string[]>> =>
            serversApi.getVoiceStates(serverId!),
        enabled: !!serverId && isValidId(serverId) && hasAuthToken(),
    });

    useEffect((): void => {
        if (query.data) {
            Object.entries(query.data).forEach(([channelId, userIds]): void => {
                dispatch(setVoiceParticipants({ channelId, userIds }));
            });
        }
    }, [query.data, dispatch]);

    return query;
};

export const useChannelPermissions = (
    serverId: string,
    channelId: string,
    options?: { enabled?: boolean },
): UseQueryResult<Record<string, Record<string, boolean>>, Error> =>
    useQuery({
        queryKey: ['servers', 'channel_permissions', serverId, channelId],
        queryFn: (): Promise<{
            permissions: Record<string, Record<string, boolean>>;
        }> => serversApi.getChannelPermissions(serverId, channelId),
        enabled: !!serverId && !!channelId && (options?.enabled ?? true),
        select: (data): Record<string, Record<string, boolean>> =>
            data.permissions,
    });

export const useUpdateChannelPermissions = (
    serverId: string,
    channelId: string,
): UseMutationResult<
    { permissions: Record<string, Record<string, boolean>> },
    Error,
    Record<string, Record<string, boolean>>
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    return useMutation({
        mutationFn: (
            permissions: Record<string, Record<string, boolean>>,
        ): Promise<{ permissions: Record<string, Record<string, boolean>> }> =>
            serversApi.updateChannelPermissions(
                serverId,
                channelId,
                permissions,
            ),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: [
                    'servers',
                    'channel_permissions',
                    serverId,
                    channelId,
                ],
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.channels(serverId),
            });
            showToast('Channel permissions updated', 'success');
        },
        onError: (error): void => {
            showToast(
                extractApiError(error, 'Failed to update channel permissions'),
                'error',
            );
        },
    });
};

export const useCategoryPermissions = (
    serverId: string,
    categoryId: string,
    options?: { enabled?: boolean },
): UseQueryResult<Record<string, Record<string, boolean>>, Error> =>
    useQuery({
        queryKey: ['servers', 'category_permissions', serverId, categoryId],
        queryFn: (): Promise<{
            permissions: Record<string, Record<string, boolean>>;
        }> => serversApi.getCategoryPermissions(serverId, categoryId),
        enabled: !!serverId && !!categoryId && (options?.enabled ?? true),
        select: (data): Record<string, Record<string, boolean>> =>
            data.permissions,
    });

export const useUpdateCategoryPermissions = (
    serverId: string,
    categoryId: string,
): UseMutationResult<
    { permissions: Record<string, Record<string, boolean>> },
    Error,
    Record<string, Record<string, boolean>>
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    return useMutation({
        mutationFn: (
            permissions: Record<string, Record<string, boolean>>,
        ): Promise<{ permissions: Record<string, Record<string, boolean>> }> =>
            serversApi.updateCategoryPermissions(
                serverId,
                categoryId,
                permissions,
            ),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: [
                    'servers',
                    'category_permissions',
                    serverId,
                    categoryId,
                ],
            });
            void queryClient.invalidateQueries({
                queryKey: ['servers', 'category_permissions', serverId],
            });
            void queryClient.invalidateQueries({
                queryKey: ['servers', 'channel_permissions', serverId],
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.categories(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.channels(serverId),
            });
            showToast('Category permissions updated', 'success');
        },
        onError: (error): void => {
            showToast(
                extractApiError(error, 'Failed to update category permissions'),
                'error',
            );
        },
    });
};

export const useUpdateChannel = (
    serverId: string,
    channelId: string,
): UseMutationResult<Channel, Error, Partial<Channel>> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (updates: Partial<Channel>): Promise<Channel> =>
            serversApi.updateChannel(serverId, channelId, updates),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.channels(serverId),
            });
        },
    });
};

export const useDeleteChannel = (
    serverId: string,
): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    return useMutation({
        mutationFn: (channelId: string): Promise<void> =>
            serversApi.deleteChannel(serverId, channelId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.channels(serverId),
            });
            showToast('Channel deleted successfully', 'success');
        },
        onError: (error): void => {
            showToast(
                extractApiError(error, 'Failed to delete channel'),
                'error',
            );
        },
    });
};

export const useUpdateCategory = (
    serverId: string,
    categoryId: string,
): UseMutationResult<Category, Error, Partial<Category>> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (updates: Partial<Category>): Promise<Category> =>
            serversApi.updateCategory(serverId, categoryId, updates),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.categories(serverId),
            });
        },
    });
};

export const useDeleteCategory = (
    serverId: string,
): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    return useMutation({
        mutationFn: (categoryId: string): Promise<void> =>
            serversApi.deleteCategory(serverId, categoryId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.categories(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.channels(serverId),
            });
            showToast('Category deleted successfully', 'success');
        },
        onError: (error): void => {
            showToast(
                extractApiError(error, 'Failed to delete category'),
                'error',
            );
        },
    });
};

export const useDeleteServer = (): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (serverId: string): Promise<void> =>
            serversApi.deleteServer(serverId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.list,
            });
        },
    });
};

export const useTransferOwnership = (
    serverId: string,
): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newOwnerId: string): Promise<void> =>
            serversApi.transferOwnership(serverId, newOwnerId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.details(serverId),
            });
        },
    });
};

export const useLeaveServer = (): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (serverId: string): Promise<void> =>
            serversApi.leaveServer(serverId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.list,
            });
            showToast('Left server successfully', 'success');
            void navigate('/chat/@me');
        },
        onError: (error): void => {
            showToast(
                extractApiError(error, 'Failed to leave server'),
                'error',
            );
        },
    });
};

export const useCreateRole = (
    serverId: string,
): UseMutationResult<
    Role,
    Error,
    { name: string; color?: string; permissions?: RolePermissions }
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    return useMutation({
        mutationFn: (data): Promise<Role> =>
            serversApi.createRole(serverId, data),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.roles(serverId),
            });
            showToast('Role created successfully', 'success');
        },
        onError: (error): void => {
            showToast(extractApiError(error, 'Failed to create role'), 'error');
        },
    });
};

export const useUpdateRole = (
    serverId: string,
): UseMutationResult<
    Role,
    Error,
    {
        roleId: string;
        updates: Partial<Role> & { permissions?: RolePermissions };
    }
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    return useMutation({
        mutationFn: ({ roleId, updates }): Promise<Role> =>
            serversApi.updateRole(serverId, roleId, updates),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.roles(serverId),
            });
            showToast('Role updated successfully', 'success');
        },
        onError: (error): void => {
            showToast(extractApiError(error, 'Failed to update role'), 'error');
        },
    });
};

export const useDeleteRole = (
    serverId: string,
): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    return useMutation({
        mutationFn: (roleId): Promise<void> =>
            serversApi.deleteRole(serverId, roleId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.roles(serverId),
            });
            showToast('Role deleted successfully', 'success');
        },
        onError: (error): void => {
            showToast(extractApiError(error, 'Failed to delete role'), 'error');
        },
    });
};

export const useReorderRoles = (
    serverId: string,
): UseMutationResult<Role[], Error, { roleId: string; position: number }[]> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    return useMutation({
        mutationFn: (rolePositions): Promise<Role[]> =>
            serversApi.reorderRoles(serverId, rolePositions),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.roles(serverId),
            });
        },
        onError: (error): void => {
            showToast(
                extractApiError(error, 'Failed to reorder roles'),
                'error',
            );
        },
    });
};

export const useAddRoleToMember = (
    serverId: string,
): UseMutationResult<
    ServerMember,
    Error,
    { userId: string; roleId: string }
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    return useMutation({
        mutationFn: ({ userId, roleId }): Promise<ServerMember> =>
            serversApi.addRoleToMember(serverId, userId, roleId),
        onMutate: async ({
            userId,
            roleId,
        }): Promise<{ previousMembers: ServerMember[] | undefined }> => {
            await queryClient.cancelQueries({
                queryKey: SERVERS_QUERY_KEYS.members(serverId),
            });

            const previousMembers = queryClient.getQueryData<ServerMember[]>(
                SERVERS_QUERY_KEYS.members(serverId),
            );

            if (previousMembers) {
                queryClient.setQueryData<ServerMember[]>(
                    SERVERS_QUERY_KEYS.members(serverId),
                    previousMembers.map(
                        (member): ServerMember =>
                            member.userId === userId
                                ? {
                                      ...member,
                                      roles: [...member.roles, roleId],
                                  }
                                : member,
                    ),
                );
            }

            return { previousMembers };
        },
        onSuccess: (updatedMember): void => {
            queryClient.setQueryData<ServerMember[]>(
                SERVERS_QUERY_KEYS.members(serverId),
                (members): ServerMember[] | undefined =>
                    members?.map(
                        (member): ServerMember =>
                            member.userId === updatedMember.userId
                                ? updatedMember
                                : member,
                    ) ?? members,
            );
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.members(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.channels(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.categories(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: ['tertiary-sidebar-data'],
            });
        },
        onError: (error, _variables, context): void => {
            if (context?.previousMembers) {
                queryClient.setQueryData(
                    SERVERS_QUERY_KEYS.members(serverId),
                    context.previousMembers,
                );
            }
            showToast(extractApiError(error, 'Failed to add role'), 'error');
        },
    });
};

export const useRemoveRoleFromMember = (
    serverId: string,
): UseMutationResult<
    ServerMember,
    Error,
    { userId: string; roleId: string }
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    return useMutation({
        mutationFn: ({ userId, roleId }): Promise<ServerMember> =>
            serversApi.removeRoleFromMember(serverId, userId, roleId),
        onMutate: async ({
            userId,
            roleId,
        }): Promise<{ previousMembers: ServerMember[] | undefined }> => {
            await queryClient.cancelQueries({
                queryKey: SERVERS_QUERY_KEYS.members(serverId),
            });

            const previousMembers = queryClient.getQueryData<ServerMember[]>(
                SERVERS_QUERY_KEYS.members(serverId),
            );

            if (previousMembers) {
                queryClient.setQueryData<ServerMember[]>(
                    SERVERS_QUERY_KEYS.members(serverId),
                    previousMembers.map(
                        (member): ServerMember =>
                            member.userId === userId
                                ? {
                                      ...member,
                                      roles: member.roles.filter(
                                          (id): boolean => id !== roleId,
                                      ),
                                  }
                                : member,
                    ),
                );
            }

            return { previousMembers };
        },
        onSuccess: (updatedMember): void => {
            queryClient.setQueryData<ServerMember[]>(
                SERVERS_QUERY_KEYS.members(serverId),
                (members): ServerMember[] | undefined =>
                    members?.map(
                        (member): ServerMember =>
                            member.userId === updatedMember.userId
                                ? updatedMember
                                : member,
                    ) ?? members,
            );
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.members(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.channels(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.categories(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: ['tertiary-sidebar-data'],
            });
        },
        onError: (error, _variables, context): void => {
            if (context?.previousMembers) {
                queryClient.setQueryData(
                    SERVERS_QUERY_KEYS.members(serverId),
                    context.previousMembers,
                );
            }
            showToast(extractApiError(error, 'Failed to remove role'), 'error');
        },
    });
};

export const useServerBans = (
    serverId: string | null,
): UseQueryResult<ServerBan[], Error> =>
    useQuery({
        queryKey: SERVERS_QUERY_KEYS.bans(serverId),
        queryFn: (): Promise<ServerBan[]> => serversApi.getBans(serverId!),
        enabled: !!serverId,
    });

export const useKickMember = (
    serverId: string,
): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (userId: string): Promise<void> =>
            serversApi.kickMember(serverId, userId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.members(serverId),
            });
            showToast('Member kicked successfully', 'success');
        },
        onError: (error): void => {
            showToast(extractApiError(error, 'Failed to kick member'), 'error');
        },
    });
};

export const useBanMember = (
    serverId: string,
): UseMutationResult<void, Error, { userId: string; reason?: string }> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: ({ userId, reason }): Promise<void> =>
            serversApi.banUser(serverId, userId, reason),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.members(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.bans(serverId),
            });
            showToast('User banned successfully', 'success');
        },
        onError: (error): void => {
            showToast(extractApiError(error, 'Failed to ban user'), 'error');
        },
    });
};

export const useTimeoutMember = (
    serverId: string,
): UseMutationResult<
    void,
    Error,
    { userId: string; duration: number; reason?: string }
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: ({ userId, duration, reason }): Promise<void> =>
            serversApi.timeoutMember(serverId, userId, duration, reason),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.members(serverId),
            });
            showToast('Member timed out successfully', 'success');
        },
        onError: (error): void => {
            showToast(
                extractApiError(error, 'Failed to timeout member'),
                'error',
            );
        },
    });
};

export const useUnbanMember = (
    serverId: string,
): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (userId: string): Promise<void> =>
            serversApi.unbanUser(serverId, userId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.bans(serverId),
            });
            showToast('User unbanned successfully', 'success');
        },
        onError: (error): void => {
            showToast(extractApiError(error, 'Failed to unban user'), 'error');
        },
    });
};

export const useMarkServerRead = (): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();

    return useMutation({
        mutationFn: (serverId: string): Promise<void> =>
            serversApi.markServerRead(serverId),
        onMutate: async (serverId) => {
            await Promise.all([
                queryClient.cancelQueries({
                    queryKey: SERVERS_QUERY_KEYS.unread(),
                }),
                queryClient.cancelQueries({ queryKey: ['pings'] }),
                queryClient.cancelQueries({
                    queryKey: SERVERS_QUERY_KEYS.channels(serverId),
                }),
            ]);

            // Snapshot the previous values
            const previousUnread = queryClient.getQueryData(
                SERVERS_QUERY_KEYS.unread(),
            );
            const previousPings = queryClient.getQueryData<{
                pings: { serverId?: string }[];
            }>(['pings']);
            const previousChannels = queryClient.getQueryData<Channel[]>(
                SERVERS_QUERY_KEYS.channels(serverId),
            );

            // Optimistically update
            if (previousUnread) {
                const newUnread = {
                    ...(previousUnread as Record<
                        string,
                        { hasUnread: boolean; pingCount: number }
                    >),
                    [serverId]: { hasUnread: false, pingCount: 0 },
                };
                queryClient.setQueryData(
                    SERVERS_QUERY_KEYS.unread(),
                    newUnread,
                );
                // Sync to redux immediately
                dispatch(setUnreadServers(newUnread));
            }

            if (previousPings) {
                queryClient.setQueryData(['pings'], {
                    ...previousPings,
                    pings: previousPings.pings.filter(
                        (p): boolean => p.serverId !== serverId,
                    ),
                });
            }

            if (previousChannels) {
                const now = new Date().toISOString();
                queryClient.setQueryData(
                    SERVERS_QUERY_KEYS.channels(serverId),
                    previousChannels.map((c) => ({ ...c, lastReadAt: now })),
                );
            }

            return { previousUnread, previousPings, previousChannels };
        },
        onError: (_err, serverId, context): void => {
            if (context?.previousUnread) {
                queryClient.setQueryData(
                    SERVERS_QUERY_KEYS.unread(),
                    context.previousUnread,
                );
                dispatch(
                    setUnreadServers(
                        context.previousUnread as Record<
                            string,
                            { hasUnread: boolean; pingCount: number }
                        >,
                    ),
                );
            }
            if (context?.previousPings) {
                queryClient.setQueryData(['pings'], context.previousPings);
            }
            if (context?.previousChannels) {
                queryClient.setQueryData(
                    SERVERS_QUERY_KEYS.channels(serverId),
                    context.previousChannels,
                );
            }
        },
        onSuccess: (_data, serverId): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.unread(),
            });
            void queryClient.invalidateQueries({
                queryKey: ['pings'],
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.details(serverId),
            });
        },
    });
};

export const useUpdateServerSettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (settings: ServerSettings) =>
            serversApi.updateServerSettings(settings),
        onSuccess: (data): void => {
            queryClient.setQueryData<User>(['me'], (old) =>
                old ? { ...old, serverSettings: data.serverSettings } : old,
            );
            void queryClient.invalidateQueries({ queryKey: ['me'] });
        },
    });
};

export const useRequestServerVerification = (
    serverId: string,
): UseMutationResult<void, Error, void> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    return useMutation({
        mutationFn: (): Promise<void> =>
            serversApi.requestServerVerification(serverId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.details(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.list,
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.discoveryStatus(serverId),
            });
            showToast('Verification requested successfully!', 'success');
        },
        onError: (error): void => {
            showToast(
                extractApiError(error, 'Failed to request verification'),
                'error',
            );
        },
    });
};
