import React, { useCallback, useMemo } from 'react';

import { useVirtualizer } from '@tanstack/react-virtual';

import type { Role, Server, ServerMember } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import { useAppSelector } from '@/store/hooks';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { UserItem } from '@/ui/components/common/UserItem';

import { type MemberGroup, buildMemberGroups } from './memberGrouping';

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

    const groups = useMemo(
        (): MemberGroup[] =>
            buildMemberGroups({
                members,
                searchQuery,
                roles,
                presenceMap,
                me,
                blocks,
            }),
        [members, searchQuery, roles, presenceMap, me, blocks],
    );

    const virtualItems = useMemo((): VirtualItemData[] => {
        const items: VirtualItemData[] = [];
        for (const group of groups) {
            items.push({
                type: 'header',
                id: group.id,
                name: group.name,
                count: group.members.length,
            });
            for (const member of group.members) {
                items.push({
                    type: 'member',
                    member,
                    groupId: group.id,
                });
            }
        }
        return items;
    }, [groups]);

    // eslint-disable-next-line react-hooks/incompatible-library
    const rowVirtualizer = useVirtualizer({
        count: virtualItems.length,
        getScrollElement: (): HTMLDivElement | null => scrollRef.current,
        estimateSize: useCallback(
            (index: number): 36 | 46 => {
                const item = virtualItems[index];
                if (!item) return 46;
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

        for (const m of members) {
            if (m?.roles) {
                const memberRoleSet = new Set(m.roles.map(String));
                const filteredRoles = roles.filter((r): boolean =>
                    memberRoleSet.has(String(r.id)),
                );

                const cached = roleListCache.current!.get(m.userId);
                if (
                    cached?.length === filteredRoles.length &&
                    cached.every(
                        // safe: guarded by the length equality check above.
                        (r, i): boolean => r.id === filteredRoles[i]!.id,
                    )
                ) {
                    map.set(m.userId, cached);
                } else {
                    map.set(m.userId, filteredRoles);
                    roleListCache.current!.set(m.userId, filteredRoles);
                }
            }
        }
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
                if (!item) return null;
                const prevItem =
                    virtualRow.index > 0
                        ? virtualItems[virtualRow.index - 1]
                        : undefined;

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
                                prevItem?.type === 'member' &&
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
                                key={String(item.member.userId)}
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
