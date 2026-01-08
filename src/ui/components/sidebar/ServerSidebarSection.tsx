import React from 'react';

import type { Role, Server, ServerMember } from '@/api/servers/servers.types';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { UserItem } from '@/ui/components/common/UserItem';

interface ServerSidebarSectionProps {
    members?: ServerMember[];
    isLoading: boolean;
    memberRoleMap: Map<string, Role>;
    serverDetails?: Server;
}

/**
 * @description Renders the member list for a server.
 */
export const ServerSidebarSection: React.FC<ServerSidebarSectionProps> = ({
    members,
    isLoading,
    memberRoleMap,
    serverDetails,
}) => (
    <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
            <div className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                Members — {members?.length || 0}
            </div>
        </div>

        {isLoading ? (
            <div className="flex justify-center py-4">
                <LoadingSpinner />
            </div>
        ) : (
            <div className="space-y-0">
                {members?.map((member) => (
                    <UserItem
                        key={member._id}
                        userId={member.userId}
                        initialData={member.user}
                        role={memberRoleMap.get(member.userId)}
                        disableCustomFonts={serverDetails?.disableCustomFonts}
                        noFetch
                    />
                ))}
            </div>
        )}
    </div>
);
