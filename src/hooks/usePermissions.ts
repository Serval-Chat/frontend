import { useMemo } from 'react';

import {
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
): UsePermissionsReturn => {
    const { data: currentUser } = useMe();
    const { data: members } = useMembers(serverId);
    const { data: roles } = useRoles(serverId);
    const { data: server } = useServerDetails(serverId);

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

        // Aggregate permissions from all roles
        userRoles.forEach((role) => {
            if (role.permissions) {
                Object.entries(role.permissions).forEach(([key, value]) => {
                    if (value === true) {
                        perms[key as keyof RolePermissions] = true;
                    }
                });
            }
        });

        // Check @everyone role
        const everyoneRole = roles?.find((r) => r.name === '@everyone');
        if (everyoneRole?.permissions) {
            Object.entries(everyoneRole.permissions).forEach(([key, value]) => {
                if (value === true) {
                    perms[key as keyof RolePermissions] = true;
                }
            });
        }

        return perms;
    }, [serverId, currentUser, server, member, userRoles, roles]);

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
        isLoading: !currentUser || !members || !roles || !server,
    };
};
