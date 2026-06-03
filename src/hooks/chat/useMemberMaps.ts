import React from 'react';

import type { Role, ServerMember } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import {
    getHighestColorRoleForMember,
    getHighestRoleWithIconForMember,
} from '@/ui/utils/chat';

interface MemberMapsResult {
    serverMemberMap: Map<string, User>;
    fullMemberMap: Map<string, ServerMember>;
    roleMap: Map<string, Role>;
    userRolesMap: Map<string, Role[]>;
    highestRoleMap: Map<string, Role>;
    iconRoleMap: Map<string, Role>;
}

/**
 * @description Hook to compute lookup maps for server members and roles.
 */
export const useMemberMaps = (
    members?: ServerMember[],
    roles?: Role[],
): MemberMapsResult => {
    // Lookup for user objects by userId
    const serverMemberMap = React.useMemo((): Map<string, User> => {
        const map = new Map<string, User>();
        members?.forEach((m): void => {
            if (m.user) map.set(m.userId, m.user);
        });
        return map;
    }, [members]);

    // Lookup for full member objects by userId
    const fullMemberMap = React.useMemo((): Map<string, ServerMember> => {
        const map = new Map<string, ServerMember>();
        members?.forEach((m): void => {
            map.set(m.userId, m);
        });
        return map;
    }, [members]);

    // Lookup for Role objects by roleId
    const roleMap = React.useMemo((): Map<string, Role> => {
        const map = new Map<string, Role>();
        roles?.forEach((r): Map<string, Role> => map.set(r.id, r));
        return map;
    }, [roles]);

    // Lookup for Role[] by userId
    const userRolesMap = React.useMemo((): Map<string, Role[]> => {
        const map = new Map<string, Role[]>();
        if (!members || !roles) return map;

        const everyoneRole = roles.find((r): boolean => r.name === '@everyone');

        members.forEach((m): void => {
            const memberRoleIds = m.roles ? [...m.roles] : [];
            if (everyoneRole && !memberRoleIds.includes(everyoneRole.id)) {
                memberRoleIds.push(everyoneRole.id);
            }
            const memberRoles = memberRoleIds
                .map((roleId): Role | undefined => roleMap.get(roleId))
                .filter((role): role is Role => !!role);
            map.set(m.userId, memberRoles);
        });
        return map;
    }, [members, roles, roleMap]);

    // Lookup for highest Role by userId
    const highestRoleMap = React.useMemo((): Map<string, Role> => {
        const map = new Map<string, Role>();
        if (!members || !roles) return map;

        const everyoneRole = roles.find((r): boolean => r.name === '@everyone');

        members.forEach((m): void => {
            const memberRoleIds = m.roles ? [...m.roles] : [];
            if (everyoneRole && !memberRoleIds.includes(everyoneRole.id)) {
                memberRoleIds.push(everyoneRole.id);
            }
            const highestRole = getHighestColorRoleForMember(
                memberRoleIds,
                roleMap,
            );
            if (highestRole) map.set(m.userId, highestRole);
        });
        return map;
    }, [members, roles, roleMap]);

    // Lookup for highest Role with icon by userId
    const iconRoleMap = React.useMemo((): Map<string, Role> => {
        const map = new Map<string, Role>();
        if (!members || !roles) return map;

        const everyoneRole = roles.find((r): boolean => r.name === '@everyone');

        members.forEach((m): void => {
            const memberRoleIds = m.roles ? [...m.roles] : [];
            if (everyoneRole && !memberRoleIds.includes(everyoneRole.id)) {
                memberRoleIds.push(everyoneRole.id);
            }
            const iconRole = getHighestRoleWithIconForMember(
                memberRoleIds,
                roleMap,
            );
            if (iconRole) map.set(m.userId, iconRole);
        });
        return map;
    }, [members, roles, roleMap]);

    return React.useMemo(
        () => ({
            serverMemberMap,
            fullMemberMap,
            roleMap,
            userRolesMap,
            highestRoleMap,
            iconRoleMap,
        }),
        [
            serverMemberMap,
            fullMemberMap,
            roleMap,
            userRolesMap,
            highestRoleMap,
            iconRoleMap,
        ],
    );
};
