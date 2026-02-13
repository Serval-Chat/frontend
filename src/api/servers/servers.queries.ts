import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';

import type { Emoji } from '@/api/emojis/emojis.types';
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
    roleId: string,
): UseMutationResult<
    Role,
    Error,
    Partial<Role> & { permissions?: RolePermissions }
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    return useMutation({
        mutationFn: (updates) =>
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
