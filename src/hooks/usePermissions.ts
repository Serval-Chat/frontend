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
            pinMessages: false,
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
                '[usePermissions] No member record found for current user - all permissions default to false.',
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
            const getOverride = (
                overrides?: Record<string, Record<string, boolean>>,
            ): boolean | undefined => {
                if (!overrides) return undefined;
                let hasDeny = false;

                for (const role of userRoles) {
                    const roleOver = overrides[role._id];
                    if (roleOver && roleOver[permKey] !== undefined) {
                        if (roleOver[permKey]) return true;
                        hasDeny = true;
                    }
                }

                const everyoneId = everyoneRole?._id;
                const everyoneOver =
                    (everyoneId ? overrides[everyoneId] : undefined) ??
                    overrides['everyone'];

                if (everyoneOver && everyoneOver[permKey] !== undefined) {
                    if (everyoneOver[permKey]) return true;
                    hasDeny = true;
                }

                return hasDeny ? false : undefined;
            };

            if (channelId && channels) {
                const channel = channels.find((c) => c._id === channelId);

                // 1. Channel Overrides
                const channelOverride = getOverride(channel?.permissions);
                if (channelOverride !== undefined) return channelOverride;

                // 2. Category Overrides
                const category =
                    channel?.categoryId && categories
                        ? categories.find((c) => c._id === channel.categoryId)
                        : null;
                const categoryOverride = getOverride(category?.permissions);
                if (categoryOverride !== undefined) return categoryOverride;
            }

            // 3. Base Server Permissions
            if (userRoles.some((r) => r.permissions?.[permKey])) return true;
            if (everyoneRole?.permissions?.[permKey]) return true;

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
