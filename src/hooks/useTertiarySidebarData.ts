import React from 'react';

import {
    useMembers,
    useRoles,
    useServerDetails,
} from '@/api/servers/servers.queries';
import type { Role, Server, ServerMember } from '@/api/servers/servers.types';
import { useMe, useUserById } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useAppSelector } from '@/store/hooks';

interface TertiarySidebarDataResult {
    selectedFriendId: null | string;
    selectedServerId: null | string;
    me: undefined | User;
    friend: undefined | User;
    serverDetails: Server | undefined;
    members: ServerMember[] | undefined;
    isLoadingMembers: boolean;
    memberRoleMap: Map<string, Role>;
    roles: Role[] | undefined;
}

/**
 * @description Hook to manage data fetching and role computation for the TertiarySidebar.
 */
export const useTertiarySidebarData = (): TertiarySidebarDataResult => {
    const selectedFriendId = useAppSelector(
        (state) => state.nav.selectedFriendId,
    );
    const selectedServerId = useAppSelector(
        (state) => state.nav.selectedServerId,
    );

    const { data: me } = useMe();
    const { data: friend } = useUserById(selectedFriendId ?? '', {
        enabled: !!selectedFriendId,
    });
    const { data: serverDetails } = useServerDetails(selectedServerId);
    const { data: members, isLoading: isLoadingMembers } =
        useMembers(selectedServerId);
    const { data: roles } = useRoles(selectedServerId);

    // Build role lookup maps
    const memberRoleMap = React.useMemo(() => {
        if (!members || !roles) return new Map<string, Role>();

        const roleMap = new Map<string, Role>();
        roles.forEach((r) => roleMap.set(r._id, r));

        const mrMap = new Map<string, Role>();
        members.forEach((m) => {
            if (!m.roles || m.roles.length === 0) return;

            let highestRole: Role | null = null;
            m.roles.forEach((roleId) => {
                const role = roleMap.get(roleId);
                if (
                    role &&
                    (!highestRole || role.position > highestRole.position)
                ) {
                    highestRole = role;
                }
            });

            if (highestRole) {
                mrMap.set(m.userId, highestRole);
            }
        });

        return mrMap;
    }, [members, roles]);

    return {
        selectedFriendId,
        selectedServerId,
        me,
        friend,
        serverDetails,
        members,
        isLoadingMembers,
        memberRoleMap,
        roles,
    };
};
