import React, { useMemo } from 'react';

import type { Role, Server, ServerMember } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import { useAppSelector } from '@/store/hooks';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { UserItem } from '@/ui/components/common/UserItem';

interface ServerSidebarSectionProps {
    members?: ServerMember[];
    isLoading: boolean;
    memberRoleMap: Map<string, Role>;
    serverDetails?: Server;
    roles?: Role[];
    searchQuery?: string;
}

interface MemberGroup {
    id: string; // roleId or 'online' or 'offline'
    name: string;
    members: ServerMember[];
    position: number; // For sorting
}

/**
 * @description Renders the member list for a server, categorized by roles.
 */
export const ServerSidebarSection: React.FC<ServerSidebarSectionProps> = ({
    members,
    isLoading,
    memberRoleMap,
    serverDetails,
    roles,
    searchQuery,
}) => {
    const presenceMap = useAppSelector((state) => state.presence.users);
    const { data: me } = useMe();

    const groups = useMemo(() => {
        if (!members) return [];

        let filteredMembers = members;

        if (searchQuery) {
            const query = searchQuery.trim();
            if (query.startsWith('/') && query.length > 2) {
                try {
                    const lastSlashIndex = query.lastIndexOf('/');
                    const pattern = query.slice(1, lastSlashIndex);
                    const flags = query.slice(lastSlashIndex + 1);
                    const regex = new RegExp(pattern, flags);

                    filteredMembers = members.filter(
                        (m) =>
                            regex.test(m.user.displayName || '') ||
                            regex.test(m.user.username || ''),
                    );
                } catch {
                    filteredMembers = [];
                }
            } else {
                const lowercaseQuery = query.toLowerCase();
                filteredMembers = members.filter(
                    (m) =>
                        (m.user.displayName || '')
                            .toLowerCase()
                            .includes(lowercaseQuery) ||
                        (m.user.username || '')
                            .toLowerCase()
                            .includes(lowercaseQuery),
                );
            }
        }

        const groupsMap = new Map<string, MemberGroup>();

        const getGroup = (
            id: string,
            name: string,
            position: number,
        ): MemberGroup => {
            if (!groupsMap.has(id)) {
                groupsMap.set(id, { id, name, members: [], position });
            }
            return groupsMap.get(id)!;
        };

        const roleLookup = new Map<string, Role>();
        if (roles) {
            roles.forEach((r) => roleLookup.set(r._id, r));
        }

        const offlineGroup = getGroup('offline', 'Offline', -9999);
        const onlineGroup = getGroup('online', 'Online', -1);

        filteredMembers.forEach((member) => {
            const presence = presenceMap[member.userId];
            const isMe = me && member.userId === me._id;
            const isOnline =
                (member.online ?? presence?.status === 'online') || isMe;

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

        const result: MemberGroup[] = Array.from(groupsMap.values())
            .filter((g) => g.members.length > 0)
            .map((g) => ({
                ...g,
                members: [...g.members].sort((a, b) => {
                    const nameA = (
                        a.user.displayName ||
                        a.user.username ||
                        ''
                    ).toLowerCase();
                    const nameB = (
                        b.user.displayName ||
                        b.user.username ||
                        ''
                    ).toLowerCase();
                    return nameA.localeCompare(nameB);
                }),
            }));

        result.sort((a, b) => b.position - a.position);

        return result;
    }, [members, searchQuery, roles, presenceMap, me]);

    return (
        <div className="space-y-4 pb-4">
            {isLoading ? (
                <div className="flex justify-center py-4">
                    <LoadingSpinner />
                </div>
            ) : (
                <>
                    {groups.map((group) => (
                        <div className="min-w-0 space-y-1" key={group.id}>
                            <div className="mb-1 flex min-w-0 items-center justify-between px-3">
                                <div className="text-foreground-muted truncate text-xs font-semibold tracking-wider uppercase">
                                    {group.name} - {group.members.length}
                                </div>
                            </div>
                            <div className="min-w-0 space-y-[2px]">
                                {group.members.map((member) => (
                                    <UserItem
                                        noFetch
                                        allRoles={roles?.filter((r) =>
                                            member.roles
                                                .map(String)
                                                .includes(String(r._id)),
                                        )}
                                        disableCustomFonts={
                                            serverDetails?.disableCustomFonts
                                        }
                                        disableGlowAndColors={
                                            serverDetails?.disableUsernameGlowAndCustomColor
                                        }
                                        initialPresenceStatus={
                                            group.id === 'offline'
                                                ? 'offline'
                                                : 'online'
                                        }
                                        joinedAt={member.joinedAt}
                                        key={String(member._id)}
                                        role={memberRoleMap.get(member.userId)}
                                        serverId={String(
                                            serverDetails?._id || '',
                                        )}
                                        serverRoles={roles}
                                        user={member.user}
                                        userId={String(member.userId)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
};
