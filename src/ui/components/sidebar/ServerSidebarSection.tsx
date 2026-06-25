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
export const ServerSidebarSection = ({
    members,
    isLoading,
    memberRoleMap,
    memberIconRoleMap,
    serverDetails,
    roles,
    searchQuery,
    scrollRef,
}: ServerSidebarSectionProps) => {
    const presenceMap = useAppSelector((state) => state.presence.users);
    const blocks = useAppSelector(
        (state): Record<string, number> => state.blocking.blocks,
    );
    const { data: me } = useMe();

    const groups = useMemo((): MemberGroup[] => {
        if (!members) return [];

        const processedMembers = members.flatMap((m) => {
            if (!m || !m.user) return [];
            const userBlocks = blocks[m.userId] || 0;
            if (userBlocks & BlockFlags.HIDE_FROM_MEMBER_LIST) return [];
            const presence = presenceMap[m.userId];
            const isMeMember = me && m.userId === me.id;
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
            const isOnline = !forceOffline && (effectiveOnline || isMeMember);

            return [
                {
                    member: m,
                    isOnline,
                    isHidden: false as const,
                    sortName: (
                        m.nickname ||
                        m.user.displayName ||
                        m.user.username ||
                        ''
                    ).toLowerCase(),
                },
            ];
        });

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
                        (pm): boolean =>
                            regex.test(pm.member.user.displayName || '') ||
                            regex.test(pm.member.user.username || ''),
                    );
                } catch {
                    finalFiltered = [];
                }
            } else {
                const lowercaseQuery = query.toLowerCase();
                finalFiltered = finalFiltered.filter((pm): boolean =>
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
            roles.forEach((r): Map<string, Role> => roleLookup.set(r.id, r));
        }

        const offlineGroup = getGroup('offline', 'Offline', -9999);
        const onlineGroup = getGroup('online', 'Online', -1);

        finalFiltered.forEach((pm): void => {
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
                    highestSeparatedRole.id,
                    highestSeparatedRole.name,
                    highestSeparatedRole.position,
                );
                group.members.push(member);
            } else {
                onlineGroup.members.push(member);
            }
        });

        const sortMap = new Map<string, string>();
        processedMembers.forEach(
            (pm): Map<string, string> =>
                sortMap.set(pm.member.userId, pm.sortName),
        );

        const result: MemberGroup[] = Array.from(groupsMap.values()).reduce<
            MemberGroup[]
        >((acc, g) => {
            if (g.members.length > 0) {
                acc.push({
                    ...g,
                    members: g.members.toSorted((a, b): number => {
                        const nameA = sortMap.get(a.userId) || '';
                        const nameB = sortMap.get(b.userId) || '';
                        return nameA.localeCompare(nameB);
                    }),
                });
            }
            return acc;
        }, []);

        result.sort((a, b): number => b.position - a.position);

        return result;
    }, [members, searchQuery, roles, presenceMap, me, blocks]);

    const virtualItems = useMemo((): VirtualItemData[] => {
        const items: VirtualItemData[] = [];
        groups.forEach((group): void => {
            items.push({
                type: 'header',
                id: group.id,
                name: group.name,
                count: group.members.length,
            });
            group.members.forEach((member): void => {
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
        getScrollElement: (): HTMLDivElement | null => scrollRef.current,
        estimateSize: useCallback(
            (index: number): 36 | 46 => {
                const item = virtualItems[index];
                if (item.type === 'header') return 36;
                return 46;
            },
            [virtualItems],
        ),
        overscan: 15,
    });
    const virtualRows = rowVirtualizer.getVirtualItems();

    const roleListCache = React.useRef<Map<string, Role[]> | null>(null);
    if (roleListCache.current === null) roleListCache.current = new Map();

    const allRolesMap = useMemo((): Map<string, Role[]> => {
        const map = new Map<string, Role[]>();
        if (!members || !roles) return map;

        members.forEach((m): void => {
            if (m?.roles) {
                const memberRoleSet = new Set(m.roles.map(String));
                const filteredRoles = roles.filter((r): boolean =>
                    memberRoleSet.has(String(r.id)),
                );

                const cached = roleListCache.current!.get(m.userId);
                if (
                    cached &&
                    cached.length === filteredRoles.length &&
                    cached.every(
                        (r, i): boolean => r.id === filteredRoles[i].id,
                    )
                ) {
                    map.set(m.userId, cached);
                } else {
                    map.set(m.userId, filteredRoles);
                    roleListCache.current!.set(m.userId, filteredRoles);
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

    if (virtualItems.length > 0 && virtualRows.length === 0) {
        return (
            <div className="relative w-full">
                {virtualItems.map((item) =>
                    item.type === 'header' ? (
                        <div
                            className="flex min-w-0 items-center justify-between px-3 pt-3 pb-2 first:pt-0"
                            key={`header-${item.id}`}
                        >
                            <div className="text-foreground-muted truncate text-xs font-semibold tracking-wider uppercase">
                                {item.name} - {item.count}
                            </div>
                        </div>
                    ) : (
                        <div
                            className="pb-0.5"
                            key={`member-${item.member.userId}`}
                        >
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
                                nickname={item.member.nickname}
                                role={memberRoleMap.get(item.member.userId)}
                                serverId={String(serverDetails?.id || '')}
                                serverRoles={roles}
                                user={item.member.user}
                                userId={String(item.member.userId)}
                            />
                        </div>
                    ),
                )}
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
            {virtualRows.map((virtualRow) => {
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
                                nickname={item.member.nickname}
                                role={memberRoleMap.get(item.member.userId)}
                                serverId={String(serverDetails?.id || '')}
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
