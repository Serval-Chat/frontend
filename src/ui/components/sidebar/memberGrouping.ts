import type { Role, ServerMember } from '@/api/servers/servers.types';
import { BlockFlags } from '@/types/blocks';

export interface MemberGroup {
    id: string; // roleId or 'online' or 'offline'
    name: string;
    members: ServerMember[];
    position: number;
}

/**
 * groups server members into role/online/offline buckets, applying block
 * filtering, an optional search query (plain or `/regex/flags`), presence, and
 * per-group alphabetical sorting. Pure - safe to memoize on its inputs.
 */
export const buildMemberGroups = ({
    members,
    searchQuery,
    roles,
    presenceMap,
    me,
    blocks,
}: {
    members?: ServerMember[];
    searchQuery?: string;
    roles?: Role[];
    presenceMap: Record<
        string,
        { status?: string; presenceStatus?: string } | undefined
    >;
    me: { id: string } | undefined;
    blocks: Record<string, number>;
}): MemberGroup[] => {
    if (!members) return [];

    const processedMembers = members.flatMap((m) => {
        if (!m?.user) return [];
        const userBlocks = blocks[m.userId] || 0;
        if (userBlocks & BlockFlags.HIDE_FROM_MEMBER_LIST) return [];
        const presence = presenceMap[m.userId];
        const isMeMember = m.userId === me?.id;
        const forceOffline = !!(userBlocks & BlockFlags.HIDE_THEIR_PRESENCE);

        const onlineFromPresence =
            presence?.status === undefined
                ? undefined
                : presence.status === 'online';
        const onlineFromMemberSnapshot = m.online ?? false;
        const effectiveOnline = onlineFromPresence ?? onlineFromMemberSnapshot;
        const isInvisible = presence?.presenceStatus === 'offline';
        const isOnline =
            !forceOffline && !isInvisible && (effectiveOnline || isMeMember);

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
        for (const r of roles) roleLookup.set(r.id, r);
    }

    const offlineGroup = getGroup('offline', 'Offline', -9999);
    const onlineGroup = getGroup('online', 'Online', -1);

    for (const pm of finalFiltered) {
        const { member, isOnline } = pm;

        if (!isOnline) {
            offlineGroup.members.push(member);
            continue;
        }

        let highestSeparatedRole: Role | null = null;

        if (member.roles && member.roles.length > 0) {
            for (const roleId of member.roles) {
                const r = roleLookup.get(roleId);
                if (
                    r &&
                    r.separateFromOtherRoles &&
                    (!highestSeparatedRole ||
                        r.position > highestSeparatedRole.position)
                ) {
                    highestSeparatedRole = r;
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
    }

    const sortMap = new Map<string, string>();
    for (const pm of processedMembers)
        sortMap.set(pm.member.userId, pm.sortName);

    const result: MemberGroup[] = [...groupsMap.values()].reduce<MemberGroup[]>(
        (acc, g) => {
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
        },
        [],
    );

    result.sort((a, b): number => b.position - a.position);

    return result;
};
