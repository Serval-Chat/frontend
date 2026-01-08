import React from 'react';

import { useTertiarySidebarData } from '@/hooks/useTertiarySidebarData';
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
    } = useTertiarySidebarData();

    return (
        <aside
            className={cn(
                'h-full w-[240px] shrink-0 border-l border-white/5 overflow-y-auto overflow-x-hidden custom-scrollbar',
                'bg-linear-to-l from-[--color-background] from-0% to-bg-secondary to-10%'
            )}
        >
            <div className="p-4 flex flex-col gap-6">
                {/* DM Context */}
                {selectedFriendId && friend && me && (
                    <DMSidebarSection friend={friend} me={me} />
                )}

                {/* Server Context */}
                {selectedServerId && (
                    <ServerSidebarSection
                        members={members}
                        isLoading={isLoadingMembers}
                        memberRoleMap={memberRoleMap}
                        serverDetails={serverDetails}
                    />
                )}
            </div>
        </aside>
    );
};
