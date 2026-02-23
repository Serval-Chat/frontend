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

        if (!member) return perms;

        // Administrator has all permissions
        if (userRoles.some((r) => r.permissions?.administrator)) {
            Object.keys(perms).forEach((key) => {
                perms[key as keyof RolePermissions] = true;
            });
            return perms;
        }

        if (everyoneRole?.permissions) {
            Object.entries(everyoneRole.permissions).forEach(([key, value]) => {
                if (value === true) {
                    perms[key as keyof RolePermissions] = true;
                }
            });
        }

        // Aggregate permissions from other roles
        userRoles.forEach((role) => {
            if (role.permissions) {
                Object.entries(role.permissions).forEach(([key, value]) => {
                    if (value === true) {
                        perms[key as keyof RolePermissions] = true;
                    }
                });
            }
        });

        // Apply channel/category overrides if channelId is provided
        if (channelId && channels) {
            const channel = channels.find((c) => c._id === channelId);
            if (channel) {
                const category =
                    channel.categoryId && categories
                        ? categories.find((c) => c._id === channel.categoryId)
                        : null;

                const sortedRolesAsc = [...userRoles].sort(
                    (a, b) => a.position - b.position,
                );
                // include everyone as the lowest role for overrides
                if (
                    everyoneRole &&
                    !sortedRolesAsc.some((r) => r._id === everyoneRole._id)
                ) {
                    sortedRolesAsc.unshift(everyoneRole);
                }

                Object.keys(perms).forEach((key) => {
                    const permKey = key as keyof RolePermissions;

                    // Channel Overrides, higher position wins
                    let overrideValue: boolean | undefined;
                    sortedRolesAsc.forEach((role) => {
                        const roleOverrides =
                            channel.permissions?.[role._id] ||
                            (role._id === everyoneRole?._id
                                ? channel.permissions?.['everyone']
                                : undefined);

                        if (
                            roleOverrides &&
                            roleOverrides[permKey] !== undefined
                        ) {
                            overrideValue = roleOverrides[permKey];
                        }
                    });

                    if (overrideValue !== undefined) {
                        perms[permKey] = overrideValue;
                        return;
                    }

                    // Category Overrides, fallback if no channel override
                    if (category) {
                        let catOverrideValue: boolean | undefined;
                        sortedRolesAsc.forEach((role) => {
                            const roleOverrides =
                                category.permissions?.[role._id] ||
                                (role._id === everyoneRole?._id
                                    ? category.permissions?.['everyone']
                                    : undefined);

                            if (
                                roleOverrides &&
                                roleOverrides[permKey] !== undefined
                            ) {
                                catOverrideValue = roleOverrides[permKey];
                            }
                        });

                        if (catOverrideValue !== undefined) {
                            perms[permKey] = catOverrideValue;
                        }
                    }
                });
            }
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
