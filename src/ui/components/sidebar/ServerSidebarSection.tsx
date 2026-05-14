import React, { useCallback, useMemo } from 'react';

import { useVirtualizer } from '@tanstack/react-virtual';

import type { Role, Server, ServerMember } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import { useAppSelector } from '@/store/hooks';
import { BlockFlags } from '@/types/blocks';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { UserItem } from '@/ui/components/common/UserItem';

interface ServerSidebarSectionProps {
    members?: ServerMember[];
    isLoading: boolean;
    memberRoleMap: Map<string, Role>;
    memberIconRoleMap: Map<string, Role>;
    serverDetails?: Server;
    roles?: Role[];
    searchQuery?: string;
    scrollRef: React.RefObject<HTMLDivElement | null>;
}

interface MemberGroup {
    id: string; // roleId or 'online' or 'offline'
    name: string;
    members: ServerMember[];
    position: number; // For sorting
}

type VirtualItemData =
    | { type: 'header'; id: string; name: string; count: number }
    | { type: 'member'; member: ServerMember; groupId: string };

/**
 * @description Renders the member list for a server, categorized by roles.
 */
export const ServerSidebarSection: React.FC<ServerSidebarSectionProps> = ({
    members,
    isLoading,
    memberRoleMap,
    memberIconRoleMap,
    serverDetails,
    roles,
    searchQuery,
    scrollRef,
}) => {
    const presenceMap = useAppSelector((state) => state.presence.users);
    const blocks = useAppSelector((state) => state.blocking.blocks);
    const { data: me } = useMe();

    const groups = useMemo(() => {
        if (!members) return [];

        const processedMembers = members
            .filter((m) => m && m.user)
            .map((m) => {
                const userBlocks = blocks[m.userId] || 0;
                const presence = presenceMap[m.userId];
                const isMeMember = me && m.userId === me._id;
                const forceOffline = !!(
                    userBlocks & BlockFlags.HIDE_THEIR_PRESENCE
                );

                const onlineFromPresence =
                    presence?.status !== undefined
                        ? presence.status === 'online'
                        : undefined;
                const onlineFromMemberSnapshot = m.online ?? false;
                const effectiveOnline =
                    onlineFromPresence ?? onlineFromMemberSnapshot;
                const isOnline =
                    !forceOffline && (effectiveOnline || isMeMember);

                return {
                    member: m,
                    isOnline,
                    isHidden: !!(userBlocks & BlockFlags.HIDE_FROM_MEMBER_LIST),
                    sortName: (
                        m.user.displayName ||
                        m.user.username ||
                        ''
                    ).toLowerCase(),
                };
            })
            .filter((pm) => !pm.isHidden);

        let finalFiltered = processedMembers;

        if (searchQuery) {
            const query = searchQuery.trim();
            if (query.startsWith('/') && query.length > 2) {
                try {
                    const lastSlashIndex = query.lastIndexOf('/');
                    const pattern = query.slice(1, lastSlashIndex);
                    const flags = query.slice(lastSlashIndex + 1);
                    const regex = new RegExp(pattern, flags);

                    finalFiltered = finalFiltered.filter(
                        (pm) =>
                            regex.test(pm.member.user.displayName || '') ||
                            regex.test(pm.member.user.username || ''),
                    );
                } catch {
                    finalFiltered = [];
                }
            } else {
                const lowercaseQuery = query.toLowerCase();
                finalFiltered = finalFiltered.filter((pm) =>
                    pm.sortName.includes(lowercaseQuery),
                );
            }
        }

        const groupsMap = new Map<string, MemberGroup>();
        const getGroup = (
            id: string,
            name: string,
            position: number,
        ): MemberGroup => {
            let g = groupsMap.get(id);
            if (!g) {
                g = { id, name, members: [], position };
                groupsMap.set(id, g);
            }
            return g;
        };

        const roleLookup = new Map<string, Role>();
        if (roles) {
            roles.forEach((r) => roleLookup.set(r._id, r));
        }

        const offlineGroup = getGroup('offline', 'Offline', -9999);
        const onlineGroup = getGroup('online', 'Online', -1);

        finalFiltered.forEach((pm) => {
            const { member, isOnline } = pm;

            if (!isOnline) {
                offlineGroup.members.push(member);
                return;
            }

            let highestSeparatedRole: Role | null = null;

            if (member.roles && member.roles.length > 0) {
                for (const roleId of member.roles) {
                    const r = roleLookup.get(roleId);
                    if (r && r.separateFromOtherRoles) {
                        if (
                            !highestSeparatedRole ||
                            r.position > highestSeparatedRole.position
                        ) {
                            highestSeparatedRole = r;
                        }
                    }
                }
            }

            if (highestSeparatedRole) {
                const group = getGroup(
                    highestSeparatedRole._id,
                    highestSeparatedRole.name,
                    highestSeparatedRole.position,
                );
                group.members.push(member);
            } else {
                onlineGroup.members.push(member);
            }
        });

        const sortMap = new Map<string, string>();
        processedMembers.forEach((pm) =>
            sortMap.set(pm.member.userId, pm.sortName),
        );

        const result: MemberGroup[] = Array.from(groupsMap.values())
            .filter((g) => g.members.length > 0)
            .map((g) => ({
                ...g,
                members: [...g.members].sort((a, b) => {
                    const nameA = sortMap.get(a.userId) || '';
                    const nameB = sortMap.get(b.userId) || '';
                    return nameA.localeCompare(nameB);
                }),
            }));

        result.sort((a, b) => b.position - a.position);

        return result;
    }, [members, searchQuery, roles, presenceMap, me, blocks]);

    const virtualItems = useMemo((): VirtualItemData[] => {
        const items: VirtualItemData[] = [];
        groups.forEach((group) => {
            items.push({
                type: 'header',
                id: group.id,
                name: group.name,
                count: group.members.length,
            });
            group.members.forEach((member) => {
                items.push({
                    type: 'member',
                    member,
                    groupId: group.id,
                });
            });
        });
        return items;
    }, [groups]);

    // eslint-disable-next-line react-hooks/incompatible-library
    const rowVirtualizer = useVirtualizer({
        count: virtualItems.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: useCallback(
            (index: number) => {
                const item = virtualItems[index];
                if (item.type === 'header') return 36;
                return 46;
            },
            [virtualItems],
        ),
        overscan: 15,
    });

    const roleListCache = React.useRef<Map<string, Role[]>>(new Map());

    const allRolesMap = useMemo(() => {
        const map = new Map<string, Role[]>();
        if (!members || !roles) return map;

        members.forEach((m) => {
            if (m?.roles) {
                const memberRoleSet = new Set(m.roles.map(String));
                const filteredRoles = roles.filter((r) =>
                    memberRoleSet.has(String(r._id)),
                );

                const cached = roleListCache.current.get(m.userId);
                if (
                    cached &&
                    cached.length === filteredRoles.length &&
                    cached.every((r, i) => r._id === filteredRoles[i]._id)
                ) {
                    map.set(m.userId, cached);
                } else {
                    map.set(m.userId, filteredRoles);
                    roleListCache.current.set(m.userId, filteredRoles);
                }
            }
        });
        return map;
    }, [members, roles]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-4">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div
            className="relative w-full"
            style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
            }}
        >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const item = virtualItems[virtualRow.index];

                return (
                    <div
                        data-index={virtualRow.index}
                        key={virtualRow.key}
                        ref={rowVirtualizer.measureElement}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualRow.start}px)`,
                            paddingBottom:
                                item.type === 'header' ? '4px' : '2px',
                            paddingTop:
                                virtualRow.index > 0 &&
                                virtualItems[virtualRow.index - 1].type ===
                                    'member' &&
                                item.type === 'header'
                                    ? '12px'
                                    : '0px',
                        }}
                    >
                        {item.type === 'header' ? (
                            <div className="flex min-w-0 items-center justify-between px-3">
                                <div className="text-foreground-muted truncate text-xs font-semibold tracking-wider uppercase">
                                    {item.name} - {item.count}
                                </div>
                            </div>
                        ) : (
                            <UserItem
                                noFetch
                                allRoles={allRolesMap.get(item.member.userId)}
                                disableCustomFonts={
                                    serverDetails?.disableCustomFonts
                                }
                                disableGlowAndColors={
                                    serverDetails?.disableUsernameGlowAndCustomColor
                                }
                                iconRole={memberIconRoleMap.get(
                                    item.member.userId,
                                )}
                                initialPresenceStatus={
                                    item.groupId === 'offline'
                                        ? 'offline'
                                        : 'online'
                                }
                                joinedAt={item.member.joinedAt}
                                role={memberRoleMap.get(item.member.userId)}
                                serverId={String(serverDetails?._id || '')}
                                serverRoles={roles}
                                user={item.member.user}
                                userId={String(item.member.userId)}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};
