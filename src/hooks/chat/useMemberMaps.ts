import React from 'react';

import type { Role, ServerMember } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import {
    getHighestRoleForMember,
    getHighestRoleWithIconForMember,
} from '@/ui/utils/chat';

interface MemberMapsResult {
    serverMemberMap: Map<string, User>;
    roleMap: Map<string, Role>;
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

    // Lookup for Role objects by roleId
    const roleMap = React.useMemo(() => {
        const map = new Map<string, Role>();
        roles?.forEach((r) => map.set(r._id, r));
        return map;
    }, [roles]);

    // Lookup for highest Role by userId
    const highestRoleMap = React.useMemo(() => {
        const map = new Map<string, Role>();
        if (!members || !roles) return map;

        members.forEach((m) => {
            const highestRole = getHighestRoleForMember(m.roles, roleMap);
            if (highestRole) map.set(m.userId, highestRole);
        });
        return map;
    }, [members, roles, roleMap]);

    // Lookup for highest Role with icon by userId
    const iconRoleMap = React.useMemo(() => {
        const map = new Map<string, Role>();
        if (!members || !roles) return map;

        members.forEach((m) => {
            const iconRole = getHighestRoleWithIconForMember(m.roles, roleMap);
            if (iconRole) map.set(m.userId, iconRole);
        });
        return map;
    }, [members, roles, roleMap]);

    return { serverMemberMap, roleMap, highestRoleMap, iconRoleMap };
};
