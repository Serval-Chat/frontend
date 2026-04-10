import { useEffect } from 'react';

import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import type { Emoji } from '@/api/emojis/emojis.types';
import type { ServerSettings, User } from '@/api/users/users.types';
import { setUnreadServers } from '@/store/slices/unreadSlice';
import { useToast } from '@/ui/components/common/Toast';

import { serversApi } from './servers.api';
import type {
    Category,
    Channel,
    Role,
    RolePermissions,
    Server,
    ServerBan,
    ServerMember,
} from './servers.types';

export const SERVERS_QUERY_KEYS = {
    list: ['servers', 'list'] as const,
    unread: () => ['servers', 'unread'] as const,
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
    bans: (serverId: string | null) => ['servers', 'bans', serverId] as const,
};

export const useServers = (): UseQueryResult<Server[], Error> =>
    useQuery({
        queryKey: SERVERS_QUERY_KEYS.list,
        queryFn: () => serversApi.getServers(),
    });

export const useUnreadStatus = (): UseQueryResult<
    Record<string, { hasUnread: boolean; pingCount: number }>,
    Error
> => {
    const dispatch = useDispatch();
    const query = useQuery({
        queryKey: SERVERS_QUERY_KEYS.unread(),
        queryFn: () => serversApi.getUnreadStatus(),
    });

    useEffect(() => {
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
        refetchInterval: (query) =>
            query.state.data?.state === 'in_progress' ? 5000 : false,
    });

export const useRequestExportChannel = (
    serverId: string,
    channelId: string,
): UseMutationResult<{ message: string; jobId: string }, Error, void> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: () => serversApi.requestExport(serverId, channelId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['servers', 'export_state', serverId, channelId],
            });
            showToast('Export requested successfully', 'success');
        },
        onError: (error) => {
            showToast(error.message || 'Failed to request export', 'error');
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
        mutationFn: ({ name, icon }) => serversApi.createServer(name, icon),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.list,
            });
            showToast('Server created successfully', 'success');
        },
        onError: (error) => {
            let message = error.message || 'Failed to create server';
            if (error instanceof AxiosError && error.response?.data?.message) {
                const apiMessage = error.response.data.message;
                message = Array.isArray(apiMessage)
                    ? apiMessage[0]
                    : apiMessage;
            }
            showToast(message, 'error');
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
        mutationFn: (inviteCode) => serversApi.joinServer(inviteCode),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.list,
            });
            showToast('Joined server successfully', 'success');
        },
        onError: (error) => {
            let message = error.message || 'Failed to join server';
            if (error instanceof AxiosError && error.response?.data?.message) {
                const apiMessage = error.response.data.message;
                message = Array.isArray(apiMessage)
                    ? apiMessage[0]
                    : apiMessage;
            }
            showToast(message, 'error');
        },
    });
};

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
        queryKey: SERVERS_QUERY_KEYS.emojis(serverId),
        queryFn: () => serversApi.getEmojis(serverId!),
        enabled: !!serverId,
    });

export const useUploadEmoji = (
    serverId: string,
): UseMutationResult<Emoji, Error, { name: string; file: File }> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: ({ name, file }) =>
            serversApi.uploadEmoji(serverId, name, file),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.emojis(serverId),
            });
            showToast('Emoji uploaded successfully', 'success');
        },
        onError: (error) => {
            let message = error.message || 'Failed to upload emoji';
            if (error instanceof AxiosError && error.response?.data?.message) {
                const apiMessage = error.response.data.message;
                message = Array.isArray(apiMessage)
                    ? apiMessage[0]
                    : apiMessage;
            }
            showToast(message, 'error');
        },
    });
};

export const useDeleteEmoji = (
    serverId: string,
): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (emojiId: string) =>
            serversApi.deleteEmoji(serverId, emojiId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.emojis(serverId),
            });
            showToast('Emoji deleted successfully', 'success');
        },
        onError: (error) => {
            showToast(error.message || 'Failed to delete emoji', 'error');
        },
    });
};

export const useUpdateServer = (
    serverId: string,
): UseMutationResult<Server, Error, Partial<Server>> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (updates: Partial<Server>) =>
            serversApi.updateServer(serverId, updates),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.details(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.list,
            });
        },
    });
};

export const useUpdateServerIcon = (
    serverId: string,
): UseMutationResult<string, Error, File> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (icon: File) => serversApi.uploadServerIcon(serverId, icon),
        onSuccess: () => {
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
        mutationFn: (banner: File) =>
            serversApi.uploadServerBanner(serverId, banner),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.details(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.list,
            });
        },
    });
};

export const useServerRoles = (
    serverId: string,
): UseQueryResult<Role[], Error> =>
    useQuery({
        queryKey: SERVERS_QUERY_KEYS.roles(serverId),
        queryFn: () => serversApi.getRoles(serverId),
        enabled: !!serverId,
    });

export const useChannelPermissions = (
    serverId: string,
    channelId: string,
    options?: { enabled?: boolean },
): UseQueryResult<Record<string, Record<string, boolean>>, Error> =>
    useQuery({
        queryKey: ['servers', 'channel_permissions', serverId, channelId],
        queryFn: () => serversApi.getChannelPermissions(serverId, channelId),
        enabled: !!serverId && !!channelId && (options?.enabled ?? true),
        select: (data) => data.permissions,
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
        mutationFn: (permissions: Record<string, Record<string, boolean>>) =>
            serversApi.updateChannelPermissions(
                serverId,
                channelId,
                permissions,
            ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [
                    'servers',
                    'channel_permissions',
                    serverId,
                    channelId,
                ],
            });
            showToast('Channel permissions updated', 'success');
        },
        onError: (error) => {
            showToast(
                error.message || 'Failed to update channel permissions',
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
        queryFn: () => serversApi.getCategoryPermissions(serverId, categoryId),
        enabled: !!serverId && !!categoryId && (options?.enabled ?? true),
        select: (data) => data.permissions,
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
        mutationFn: (permissions: Record<string, Record<string, boolean>>) =>
            serversApi.updateCategoryPermissions(
                serverId,
                categoryId,
                permissions,
            ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [
                    'servers',
                    'category_permissions',
                    serverId,
                    categoryId,
                ],
            });
            showToast('Category permissions updated', 'success');
        },
        onError: (error) => {
            showToast(
                error.message || 'Failed to update category permissions',
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
        mutationFn: (updates: Partial<Channel>) =>
            serversApi.updateChannel(serverId, channelId, updates),
        onSuccess: () => {
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
        mutationFn: (channelId: string) =>
            serversApi.deleteChannel(serverId, channelId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.channels(serverId),
            });
            showToast('Channel deleted successfully', 'success');
        },
        onError: (error) => {
            showToast(error.message || 'Failed to delete channel', 'error');
        },
    });
};

export const useUpdateCategory = (
    serverId: string,
    categoryId: string,
): UseMutationResult<Category, Error, Partial<Category>> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (updates: Partial<Category>) =>
            serversApi.updateCategory(serverId, categoryId, updates),
        onSuccess: () => {
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
        mutationFn: (categoryId: string) =>
            serversApi.deleteCategory(serverId, categoryId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.categories(serverId),
            });
            showToast('Category deleted successfully', 'success');
        },
        onError: (error) => {
            showToast(error.message || 'Failed to delete category', 'error');
        },
    });
};

export const useDeleteServer = (): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (serverId: string) => serversApi.deleteServer(serverId),
        onSuccess: () => {
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
        mutationFn: (newOwnerId: string) =>
            serversApi.transferOwnership(serverId, newOwnerId),
        onSuccess: () => {
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
        mutationFn: (serverId: string) => serversApi.leaveServer(serverId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.list,
            });
            showToast('Left server successfully', 'success');
            void navigate('/chat/@me');
        },
        onError: (error) => {
            showToast(error.message || 'Failed to leave server', 'error');
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
        mutationFn: (data) => serversApi.createRole(serverId, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.roles(serverId),
            });
            showToast('Role created successfully', 'success');
        },
        onError: (error) => {
            showToast(error.message || 'Failed to create role', 'error');
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
        mutationFn: ({ roleId, updates }) =>
            serversApi.updateRole(serverId, roleId, updates),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.roles(serverId),
            });
            showToast('Role updated successfully', 'success');
        },
        onError: (error) => {
            showToast(error.message || 'Failed to update role', 'error');
        },
    });
};

export const useDeleteRole = (
    serverId: string,
): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    return useMutation({
        mutationFn: (roleId) => serversApi.deleteRole(serverId, roleId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.roles(serverId),
            });
            showToast('Role deleted successfully', 'success');
        },
        onError: (error) => {
            showToast(error.message || 'Failed to delete role', 'error');
        },
    });
};

export const useReorderRoles = (
    serverId: string,
): UseMutationResult<Role[], Error, { roleId: string; position: number }[]> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    return useMutation({
        mutationFn: (rolePositions) =>
            serversApi.reorderRoles(serverId, rolePositions),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.roles(serverId),
            });
        },
        onError: (error) => {
            showToast(error.message || 'Failed to reorder roles', 'error');
        },
    });
};

export const useAddRoleToMember = (
    serverId: string,
): UseMutationResult<void, Error, { userId: string; roleId: string }> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    return useMutation({
        mutationFn: ({ userId, roleId }) =>
            serversApi.addRoleToMember(serverId, userId, roleId),
        onMutate: async ({ userId, roleId }) => {
            await queryClient.cancelQueries({
                queryKey: SERVERS_QUERY_KEYS.members(serverId),
            });

            const previousMembers = queryClient.getQueryData<ServerMember[]>(
                SERVERS_QUERY_KEYS.members(serverId),
            );

            if (previousMembers) {
                queryClient.setQueryData<ServerMember[]>(
                    SERVERS_QUERY_KEYS.members(serverId),
                    previousMembers.map((member) =>
                        member.userId === userId
                            ? { ...member, roles: [...member.roles, roleId] }
                            : member,
                    ),
                );
            }

            return { previousMembers };
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.members(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: ['tertiary-sidebar-data'],
            });
        },
        onError: (error, _variables, context) => {
            if (context?.previousMembers) {
                queryClient.setQueryData(
                    SERVERS_QUERY_KEYS.members(serverId),
                    context.previousMembers,
                );
            }
            showToast(error.message || 'Failed to add role', 'error');
        },
    });
};

export const useRemoveRoleFromMember = (
    serverId: string,
): UseMutationResult<void, Error, { userId: string; roleId: string }> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    return useMutation({
        mutationFn: ({ userId, roleId }) =>
            serversApi.removeRoleFromMember(serverId, userId, roleId),
        onMutate: async ({ userId, roleId }) => {
            await queryClient.cancelQueries({
                queryKey: SERVERS_QUERY_KEYS.members(serverId),
            });

            const previousMembers = queryClient.getQueryData<ServerMember[]>(
                SERVERS_QUERY_KEYS.members(serverId),
            );

            if (previousMembers) {
                queryClient.setQueryData<ServerMember[]>(
                    SERVERS_QUERY_KEYS.members(serverId),
                    previousMembers.map((member) =>
                        member.userId === userId
                            ? {
                                  ...member,
                                  roles: member.roles.filter(
                                      (id) => id !== roleId,
                                  ),
                              }
                            : member,
                    ),
                );
            }

            return { previousMembers };
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.members(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: ['tertiary-sidebar-data'],
            });
        },
        onError: (error, _variables, context) => {
            if (context?.previousMembers) {
                queryClient.setQueryData(
                    SERVERS_QUERY_KEYS.members(serverId),
                    context.previousMembers,
                );
            }
            showToast(error.message || 'Failed to remove role', 'error');
        },
    });
};

export const useServerBans = (
    serverId: string | null,
): UseQueryResult<ServerBan[], Error> =>
    useQuery({
        queryKey: SERVERS_QUERY_KEYS.bans(serverId),
        queryFn: () => serversApi.getBans(serverId!),
        enabled: !!serverId,
    });

export const useKickMember = (
    serverId: string,
): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (userId: string) => serversApi.kickMember(serverId, userId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.members(serverId),
            });
            showToast('Member kicked successfully', 'success');
        },
        onError: (error) => {
            showToast(error.message || 'Failed to kick member', 'error');
        },
    });
};

export const useBanMember = (
    serverId: string,
): UseMutationResult<void, Error, { userId: string; reason?: string }> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: ({ userId, reason }) =>
            serversApi.banUser(serverId, userId, reason),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.members(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.bans(serverId),
            });
            showToast('User banned successfully', 'success');
        },
        onError: (error) => {
            showToast(error.message || 'Failed to ban user', 'error');
        },
    });
};

export const useUnbanMember = (
    serverId: string,
): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (userId: string) => serversApi.unbanUser(serverId, userId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.bans(serverId),
            });
            showToast('User unbanned successfully', 'success');
        },
        onError: (error) => {
            showToast(error.message || 'Failed to unban user', 'error');
        },
    });
};

export const useMarkServerRead = (): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();

    return useMutation({
        mutationFn: (serverId: string) => serversApi.markServerRead(serverId),
        onMutate: async (serverId) => {
            await queryClient.cancelQueries({
                queryKey: SERVERS_QUERY_KEYS.unread(),
            });
            await queryClient.cancelQueries({ queryKey: ['pings'] });
            await queryClient.cancelQueries({
                queryKey: SERVERS_QUERY_KEYS.channels(serverId),
            });

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
                        (p) => p.serverId !== serverId,
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
        onError: (_err, serverId, context) => {
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
        onSuccess: (_data, serverId) => {
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.unread(),
            });
            void queryClient.invalidateQueries({
                queryKey: ['pings'],
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.channels(serverId),
            });
            void queryClient.invalidateQueries({
                queryKey: SERVERS_QUERY_KEYS.details(serverId),
            });
        },
    });
};

export const useUpdateServerSettings = (): UseMutationResult<
    { message: string; serverSettings: ServerSettings },
    Error,
    ServerSettings
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (settings: ServerSettings) =>
            serversApi.updateServerSettings(settings),
        onSuccess: (data) => {
            queryClient.setQueryData<User>(['me'], (old) =>
                old ? { ...old, serverSettings: data.serverSettings } : old,
            );
            void queryClient.invalidateQueries({ queryKey: ['me'] });
        },
    });
};
