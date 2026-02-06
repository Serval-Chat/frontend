import React, { useMemo } from 'react';

import type { Role, Server, ServerMember } from '@/api/servers/servers.types';
import { useAppSelector } from '@/store/hooks';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { UserItem } from '@/ui/components/common/UserItem';

interface ServerSidebarSectionProps {
    members?: ServerMember[];
    isLoading: boolean;
    memberRoleMap: Map<string, Role>;
    serverDetails?: Server;
    roles?: Role[];
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
}) => {
    const presenceMap = useAppSelector((state) => state.presence.users);

    const groups = useMemo(() => {
        if (!members) return [];

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

        members.forEach((member) => {
            const presence = presenceMap[member.userId];
            const isOnline = presence?.status === 'online';

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

        const result: MemberGroup[] = [];
        groupsMap.forEach((g) => {
            if (g.members.length > 0) result.push(g);
        });

        result.sort((a, b) => b.position - a.position);

        return result;
    }, [members, roles, presenceMap]);

    return (
        <div className="space-y-4 pb-4">
            {isLoading ? (
                <div className="flex justify-center py-4">
                    <LoadingSpinner />
                </div>
            ) : (
                <>
                    {groups.map((group) => (
                        <div className="space-y-1" key={group.id}>
                            <div className="flex items-center justify-between px-3 mb-1">
                                <div className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                                    {group.name} — {group.members.length}
                                </div>
                            </div>
                            <div className="space-y-[2px]">
                                {group.members.map((member) => (
                                    <UserItem
                                        disableGlow
                                        noFetch
                                        allRoles={roles?.filter((r) =>
                                            member.roles
                                                .map(String)
                                                .includes(String(r._id)),
                                        )}
                                        disableCustomFonts={
                                            serverDetails?.disableCustomFonts
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
