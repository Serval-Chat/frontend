import React from 'react';

import { useLocation, useParams } from 'react-router-dom';

import {
    useMembers,
    useRoles,
    useServerDetails,
} from '@/api/servers/servers.queries';
import type { Role, Server, ServerMember } from '@/api/servers/servers.types';
import { useMe, useUserById } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useAppSelector } from '@/store/hooks';
import {
    getHighestColorRoleForMember,
    getHighestRoleWithIconForMember,
} from '@/ui/utils/chat';

interface TertiarySidebarDataResult {
    selectedFriendId: null | string;
    selectedServerId: null | string;
    me: undefined | User;
    friend: undefined | User;
    serverDetails: Server | undefined;
    members: ServerMember[] | undefined;
    isLoadingMembers: boolean;
    memberRoleMap: Map<string, Role>;
    memberIconRoleMap: Map<string, Role>;
    roles: Role[] | undefined;
}

interface TertiarySidebarDataOptions {
    selectedFriendId?: null | string;
    selectedServerId?: null | string;
    ignoreUrlMatch?: boolean;
}

/**
 * @description Hook to manage data fetching and role computation for the TertiarySidebar.
 */
export const useTertiarySidebarData = (
    options: TertiarySidebarDataOptions = {},
): TertiarySidebarDataResult => {
    const location = useLocation();
    const params = useParams();
    const storeSelectedFriendId = useAppSelector(
        (state) => state.nav.selectedFriendId,
    );
    const storeSelectedServerId = useAppSelector(
        (state) => state.nav.selectedServerId,
    );
    const isSplitViewActive = useAppSelector(
        (state) => !!(state.nav.splitView.left || state.nav.splitView.right),
    );
    const selectedFriendId =
        options.selectedFriendId !== undefined
            ? options.selectedFriendId
            : storeSelectedFriendId;
    const selectedServerId =
        options.selectedServerId !== undefined
            ? options.selectedServerId
            : storeSelectedServerId;
    const isServerContextReady =
        !!selectedServerId &&
        (options.ignoreUrlMatch ||
            isSplitViewActive ||
            (location.pathname.includes('/@server/') &&
                selectedServerId === params.serverId));

    const { data: me } = useMe();
    const { data: friend } = useUserById(selectedFriendId ?? '', {
        enabled: !!selectedFriendId,
    });

    const { data: serverDetails } = useServerDetails(selectedServerId, {
        enabled: isServerContextReady,
    });
    const { data: members, isLoading: isLoadingMembers } = useMembers(
        selectedServerId,
        { enabled: isServerContextReady },
    );
    const { data: roles } = useRoles(selectedServerId, {
        enabled: isServerContextReady,
    });

    // Build role lookup maps
    const { memberRoleMap, memberIconRoleMap } = React.useMemo(() => {
        const mrMap = new Map<string, Role>();
        const mirMap = new Map<string, Role>();
        if (!members || !roles)
            return { memberRoleMap: mrMap, memberIconRoleMap: mirMap };

        const roleMap = new Map<string, Role>();
        roles.forEach((r) => roleMap.set(r._id, r));

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
            if (highestRole) {
                mrMap.set(m.userId, highestRole);
            }

            const iconRole = getHighestRoleWithIconForMember(
                memberRoleIds,
                roleMap,
            );
            if (iconRole) {
                mirMap.set(m.userId, iconRole);
            }
        });

        return { memberRoleMap: mrMap, memberIconRoleMap: mirMap };
    }, [members, roles]);

    return React.useMemo(
        () => ({
            selectedFriendId,
            selectedServerId,
            me,
            friend,
            serverDetails,
            members,
            isLoadingMembers,
            memberRoleMap,
            memberIconRoleMap,
            roles,
        }),
        [
            selectedFriendId,
            selectedServerId,
            me,
            friend,
            serverDetails,
            members,
            isLoadingMembers,
            memberRoleMap,
            memberIconRoleMap,
            roles,
        ],
    );
};
