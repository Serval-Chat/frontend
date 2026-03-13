import { X } from 'lucide-react';

import { useResizable } from '@/hooks/useResizable';
import { useTertiarySidebarData } from '@/hooks/useTertiarySidebarData';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleMobileMemberList } from '@/store/slices/navSlice';
import { Resizer } from '@/ui/components/common/Resizer';
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

    const dispatch = useAppDispatch();
    const showMobileMemberList = useAppSelector(
        (state) => state.nav.showMobileMemberList,
    );

    const { width, isResizing, handleMouseDown } = useResizable({
        initialWidth: 240,
        minWidth: 200,
        maxWidth: 480,
        storageKey: 'tertiary-sidebar-width',
        side: 'right',
    });

    return (
        <Box
            as="aside"
            className={cn(
                'custom-scrollbar relative h-full shrink-0 overflow-x-hidden overflow-y-auto bg-[var(--tertiary-bg)]',
                'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
                'md:block',
                'max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:z-50 max-md:w-64 max-md:shadow-2xl',
                'max-md:transition-transform max-md:duration-300 max-md:[transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)]',
                showMobileMemberList
                    ? 'max-md:translate-x-0'
                    : 'max-md:translate-x-full',
            )}
            style={{ width: `${width}px` }}
        >
            <Resizer
                isResizing={isResizing}
                side="left"
                onMouseDown={handleMouseDown}
            />
            {/* Mobile close button row */}
            {showMobileMemberList && (
                <div className="flex items-center justify-between px-3 pt-3 pb-1 md:hidden">
                    <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        Members
                    </span>
                    <button
                        aria-label="Close member list"
                        className="p-1 text-muted-foreground transition-colors hover:text-foreground"
                        onClick={() => dispatch(toggleMobileMemberList())}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
            <Box className="flex min-w-0 flex-col gap-4 p-3">
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
