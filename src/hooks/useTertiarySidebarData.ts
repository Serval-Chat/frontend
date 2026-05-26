import React from 'react';

import { useLocation, useParams } from 'react-router-dom';

import {
    useCategories,
    useChannels,
    useMembers,
    useRoles,
    useServerDetails,
} from '@/api/servers/servers.queries';
import type {
    Category,
    Channel,
    Role,
    RolePermissions,
    Server,
    ServerMember,
} from '@/api/servers/servers.types';
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
    selectedChannelId?: null | string;
    selectedServerId?: null | string;
    ignoreUrlMatch?: boolean;
}

const canMemberViewChannel = ({
    categories,
    channel,
    member,
    roles,
    serverDetails,
}: {
    categories: Category[] | undefined;
    channel: Channel | undefined;
    member: ServerMember;
    roles: Role[] | undefined;
    serverDetails: Server | undefined;
}): boolean => {
    if (!channel || !roles || !serverDetails) return true;
    if (serverDetails.ownerId === member.userId) return true;

    const roleMap = new Map<string, Role>();
    roles.forEach((role) => roleMap.set(role._id, role));

    const userRoles = member.roles
        .map((roleId) => roleMap.get(roleId))
        .filter((role): role is Role => !!role)
        .sort((a, b) => b.position - a.position);

    if (userRoles.some((role) => role.permissions?.administrator)) {
        return true;
    }

    const everyoneRole = roles.find((role) => role.name === '@everyone');

    const getOverride = (
        overrides?: Record<string, Record<string, boolean>>,
        permissionKey: keyof RolePermissions = 'viewChannels',
    ): boolean | undefined => {
        if (!overrides) return undefined;
        let hasDeny = false;

        for (const role of userRoles) {
            const roleOverride = overrides[role._id];
            if (roleOverride?.[permissionKey] !== undefined) {
                if (roleOverride[permissionKey]) return true;
                hasDeny = true;
            }
        }

        const everyoneOverride =
            (everyoneRole ? overrides[everyoneRole._id] : undefined) ??
            overrides.everyone;

        if (everyoneOverride?.[permissionKey] !== undefined) {
            if (everyoneOverride[permissionKey]) return true;
            hasDeny = true;
        }

        return hasDeny ? false : undefined;
    };

    const channelOverride = getOverride(channel.permissions);
    if (channelOverride !== undefined) return channelOverride;

    const category = channel.categoryId
        ? categories?.find((item) => item._id === channel.categoryId)
        : undefined;
    const categoryOverride = getOverride(
        category?.permissions,
        'viewCategories',
    );
    if (categoryOverride !== undefined) return categoryOverride;

    if (userRoles.some((role) => role.permissions?.viewCategories)) return true;
    if (everyoneRole?.permissions?.viewCategories) return true;

    if (userRoles.some((role) => role.permissions?.viewChannels)) return true;
    if (everyoneRole?.permissions?.viewChannels) return true;

    return true;
};

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
    const storeSelectedChannelId = useAppSelector(
        (state) => state.nav.selectedChannelId,
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
    const selectedChannelId =
        options.selectedChannelId !== undefined
            ? options.selectedChannelId
            : storeSelectedChannelId;
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
    const { data: channels } = useChannels(selectedServerId, {
        enabled: isServerContextReady && !!selectedChannelId,
    });
    const { data: categories } = useCategories(selectedServerId, {
        enabled: isServerContextReady && !!selectedChannelId,
    });

    const visibleMembers = React.useMemo(() => {
        if (!members || !selectedChannelId) return members;
        if (!channels || !categories || !roles || !serverDetails) {
            return undefined;
        }

        const channel = channels?.find(
            (item) => item._id === selectedChannelId,
        );
        if (!channel) return [];

        return members.filter((member) =>
            canMemberViewChannel({
                categories,
                channel,
                member,
                roles,
                serverDetails,
            }),
        );
    }, [
        categories,
        channels,
        members,
        roles,
        selectedChannelId,
        serverDetails,
    ]);

    const isLoadingVisibleMembers =
        isLoadingMembers ||
        (!!selectedChannelId &&
            (!channels || !categories || !roles || !serverDetails));

    // Build role lookup maps
    const { memberRoleMap, memberIconRoleMap } = React.useMemo(() => {
        const mrMap = new Map<string, Role>();
        const mirMap = new Map<string, Role>();
        if (!visibleMembers || !roles)
            return { memberRoleMap: mrMap, memberIconRoleMap: mirMap };

        const roleMap = new Map<string, Role>();
        roles.forEach((r) => roleMap.set(r._id, r));

        const everyoneRole = roles.find((r) => r.name === '@everyone');

        visibleMembers.forEach((m) => {
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
    }, [visibleMembers, roles]);

    return React.useMemo(
        () => ({
            selectedFriendId,
            selectedServerId,
            me,
            friend,
            serverDetails,
            members: visibleMembers,
            isLoadingMembers: isLoadingVisibleMembers,
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
            visibleMembers,
            isLoadingVisibleMembers,
            memberRoleMap,
            memberIconRoleMap,
            roles,
        ],
    );
};
