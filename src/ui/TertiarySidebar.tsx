import React from 'react';

import { useTertiarySidebarData } from '@/hooks/useTertiarySidebarData';
import { Box } from '@/ui/components/layout/Box';
import { DMSidebarSection } from '@/ui/components/sidebar/DMSidebarSection';
import { ServerSidebarSection } from '@/ui/components/sidebar/ServerSidebarSection';
import { cn } from '@/utils/cn';

/**
 * @description Tertiary sidebar displaying DM participants or Server members.
 */
export const TertiarySidebar: React.FC = () => {
    const {
        selectedFriendId,
        selectedServerId,
        me,
        friend,
        serverDetails,
        members,
        isLoadingMembers,
        memberRoleMap,
        roles,
    } = useTertiarySidebarData();

    return (
        <Box
            as="aside"
            className={cn(
                'h-full w-[240px] shrink-0 overflow-y-auto overflow-x-hidden custom-scrollbar bg-[var(--tertiary-bg)]'
            )}
        >
            <Box className="p-3 flex flex-col gap-4">
                {/* DM Context */}
                {selectedFriendId && friend && me && (
                    <DMSidebarSection friend={friend} me={me} />
                )}

                {/* Server Context */}
                {selectedServerId && (
                    <ServerSidebarSection
                        isLoading={isLoadingMembers}
                        memberRoleMap={memberRoleMap}
                        members={members}
                        roles={roles}
                        serverDetails={serverDetails}
                    />
                )}
            </Box>
        </Box>
    );
};
