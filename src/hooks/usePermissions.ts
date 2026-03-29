import { useMemo } from 'react';

import {
    useCategories,
    useChannels,
    useMembers,
    useRoles,
    useServerDetails,
} from '@/api/servers/servers.queries';
import type { RolePermissions } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';

export interface UsePermissionsReturn {
    permissions: Record<keyof RolePermissions, boolean>;
    hasPermission: (permission: keyof RolePermissions) => boolean;
    isOwner: boolean;
    isLoading: boolean;
}

export const usePermissions = (
    serverId: string | null,
    channelId?: string | null,
): UsePermissionsReturn => {
    const { data: currentUser } = useMe();
    const { data: members } = useMembers(serverId);
    const { data: roles } = useRoles(serverId);
    const { data: server } = useServerDetails(serverId);
    const { data: channels } = useChannels(serverId);
    const { data: categories } = useCategories(serverId);

    const member = useMemo(() => {
        if (!members || !currentUser || !serverId) return null;
        return members.find((m) => m.userId === currentUser._id);
    }, [members, currentUser, serverId]);

    const userRoles = useMemo(() => {
        if (!member || !roles) return [];
        return roles
            .filter((role) => member.roles.includes(role._id))
            .sort((a, b) => b.position - a.position);
    }, [member, roles]);

    const everyoneRole = useMemo(
        () => roles?.find((r) => r.name === '@everyone'),
        [roles],
    );

    const permissions = useMemo(() => {
        const perms: Record<keyof RolePermissions, boolean> = {
            sendMessages: false,
            manageMessages: false,
            deleteMessagesOfOthers: false,
            manageChannels: false,
            manageRoles: false,
            banMembers: false,
            kickMembers: false,
            manageInvites: false,
            manageServer: false,
            administrator: false,
            pingRolesAndEveryone: false,
            manageReactions: false,
            addReactions: false,
            viewChannels: false,
            connect: false,
            export_channel_messages: false,
            bypassSlowmode: false,
        };

        if (!serverId || !currentUser) return perms;

        // Owner has all permissions
        if (
            server?.ownerId &&
            currentUser?._id &&
            server.ownerId === currentUser._id
        ) {
            Object.keys(perms).forEach((key) => {
                perms[key as keyof RolePermissions] = true;
            });
            return perms;
        }

        if (!member) {
            console.warn(
                '[usePermissions] No member record found for current user — all permissions default to false.',
                {
                    serverId,
                    currentUserId: currentUser?._id,
                    memberUserIds: members?.map((m) => m.userId),
                },
            );
            return perms;
        }

        // Administrator has all permissions
        if (userRoles.some((r) => r.permissions?.administrator)) {
            Object.keys(perms).forEach((key) => {
                perms[key as keyof RolePermissions] = true;
            });
            return perms;
        }

        const evaluatePermission = (
            permKey: keyof RolePermissions,
        ): boolean => {
            if (channelId && channels) {
                const channel = channels.find((c) => c._id === channelId);
                if (channel && channel.permissions) {
                    for (const role of userRoles) {
                        const roleOverrides = channel.permissions[role._id];
                        if (
                            roleOverrides &&
                            roleOverrides[permKey] !== undefined
                        ) {
                            return roleOverrides[permKey] as boolean;
                        }
                    }
                    const everyoneOverrides = channel.permissions['everyone'];
                    if (
                        everyoneOverrides &&
                        everyoneOverrides[permKey] !== undefined
                    ) {
                        return everyoneOverrides[permKey] as boolean;
                    }
                }

                const category =
                    channel?.categoryId && categories
                        ? categories.find((c) => c._id === channel.categoryId)
                        : null;

                if (category && category.permissions) {
                    for (const role of userRoles) {
                        const roleOverrides = category.permissions[role._id];
                        if (
                            roleOverrides &&
                            roleOverrides[permKey] !== undefined
                        ) {
                            return roleOverrides[permKey] as boolean;
                        }
                    }
                    const everyoneOverrides = category.permissions['everyone'];
                    if (
                        everyoneOverrides &&
                        everyoneOverrides[permKey] !== undefined
                    ) {
                        return everyoneOverrides[permKey] as boolean;
                    }
                }
            }

            for (const role of userRoles) {
                if (
                    role.permissions &&
                    role.permissions[permKey] !== undefined
                ) {
                    return role.permissions[permKey] as boolean;
                }
            }

            if (
                everyoneRole &&
                everyoneRole.permissions &&
                everyoneRole.permissions[permKey] !== undefined
            ) {
                return everyoneRole.permissions[permKey] as boolean;
            }

            if (permKey === 'viewChannels' || permKey === 'connect')
                return true;
            return false;
        };

        Object.keys(perms).forEach((key) => {
            perms[key as keyof RolePermissions] = evaluatePermission(
                key as keyof RolePermissions,
            );
        });

        if (!perms.viewChannels && channelId) {
            console.warn(
                `[usePermissions] viewChannels=false for channel ${channelId} (server ${serverId})`,
                {
                    channelPermissions:
                        channelId && channels
                            ? channels.find((c) => c._id === channelId)
                                  ?.permissions
                            : undefined,
                    userRoles: userRoles.map((r) => ({
                        id: r._id,
                        name: r.name,
                        position: r.position,
                    })),
                    everyonePermissions: everyoneRole?.permissions,
                    computedPerms: perms,
                },
            );
        }
        return perms;
    }, [
        serverId,
        currentUser,
        server,
        member,
        userRoles,
        everyoneRole,
        channelId,
        channels,
        categories,
        members,
    ]);

    const hasPermission = (permission: keyof RolePermissions): boolean =>
        permissions[permission] || false;

    return {
        permissions,
        hasPermission,
        isOwner: !!(
            server?.ownerId &&
            currentUser?._id &&
            server.ownerId === currentUser._id
        ),
        isLoading:
            !currentUser ||
            !members ||
            !roles ||
            !server ||
            !channels ||
            !categories,
    };
};
