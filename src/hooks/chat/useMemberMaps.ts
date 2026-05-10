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
    const serverMemberMap = React.useMemo(() => {
        const map = new Map<string, User>();
        members?.forEach((m) => {
            if (m.user) map.set(m.userId, m.user);
        });
        return map;
    }, [members]);

    // Lookup for full member objects by userId
    const fullMemberMap = React.useMemo(() => {
        const map = new Map<string, ServerMember>();
        members?.forEach((m) => {
            map.set(m.userId, m);
        });
        return map;
    }, [members]);

    // Lookup for Role objects by roleId
    const roleMap = React.useMemo(() => {
        const map = new Map<string, Role>();
        roles?.forEach((r) => map.set(r._id, r));
        return map;
    }, [roles]);

    // Lookup for Role[] by userId
    const userRolesMap = React.useMemo(() => {
        const map = new Map<string, Role[]>();
        if (!members || !roles) return map;

        members.forEach((m) => {
            const memberRoles = roles.filter((r) => m.roles.includes(r._id));
            map.set(m.userId, memberRoles);
        });
        return map;
    }, [members, roles]);

    // Lookup for highest Role by userId
    const highestRoleMap = React.useMemo(() => {
        const map = new Map<string, Role>();
        if (!members || !roles) return map;

        const everyoneRole = roles.find((r) => r.name === '@everyone');

        members.forEach((m) => {
            const memberRoleIds = m.roles ? [...m.roles] : [];
            if (everyoneRole && !memberRoleIds.includes(everyoneRole._id)) {
                memberRoleIds.push(everyoneRole._id);
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
    const iconRoleMap = React.useMemo(() => {
        const map = new Map<string, Role>();
        if (!members || !roles) return map;

        const everyoneRole = roles.find((r) => r.name === '@everyone');

        members.forEach((m) => {
            const memberRoleIds = m.roles ? [...m.roles] : [];
            if (everyoneRole && !memberRoleIds.includes(everyoneRole._id)) {
                memberRoleIds.push(everyoneRole._id);
            }
            const iconRole = getHighestRoleWithIconForMember(
                memberRoleIds,
                roleMap,
            );
            if (iconRole) map.set(m.userId, iconRole);
        });
        return map;
    }, [members, roles, roleMap]);

    return {
        serverMemberMap,
        fullMemberMap,
        roleMap,
        userRolesMap,
        highestRoleMap,
        iconRoleMap,
    };
};
