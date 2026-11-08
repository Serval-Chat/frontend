import { useLocation } from 'react-router-dom';

import { useMobileSwipeContext } from '@/app/shell/MobileSwipeContext';
import { ActiveVoicePanel } from '@/features/chat/ActiveVoicePanel';
import { FriendsSection } from '@/features/friends/FriendsSection';
import { ServerSection } from '@/features/servers/ServerSection';
import { MiniProfile } from '@/features/users/profile/MiniProfile';
import { useResizable } from '@/hooks/useResizable';
import { useAppShallowSelector } from '@/store/hooks';
import { Box } from '@/ui/primitives/Box';
import { Resizer } from '@/ui/primitives/Resizer';
import { cn } from '@/utils/cn';
import { SERVER_SUBPAGE_PATHS } from '@/utils/serverSubpages';

/**
 * @description Secondary navigation bar
 */
export const SecondaryNavBar = () => {
    const { navMode, mobileHomeTab, selectedFriendId, selectedChannelId } =
        useAppShallowSelector((state) => ({
            navMode: state.nav.navMode,
            mobileHomeTab: state.nav.mobileHomeTab,
            selectedFriendId: state.nav.selectedFriendId,
            selectedChannelId: state.nav.selectedChannelId,
        }));
    const { width, isResizing, handleMouseDown } = useResizable({
        initialWidth: 240,
        minWidth: 200,
        maxWidth: 480,
        storageKey: 'secondary-navbar-width',
        side: 'left',
    });
    const inSwipePanel = useMobileSwipeContext();
    const location = useLocation();

    const isRolesView = location.pathname.endsWith(
        SERVER_SUBPAGE_PATHS.selfRoles,
    );
    const isChannelsView = location.pathname.endsWith(
        SERVER_SUBPAGE_PATHS.channelsAndCategories,
    );

    const isNothingSelected = !selectedFriendId && !selectedChannelId;

    return (
        <Box
            as="aside"
            className={cn(
                'no-scrollbar pride-glass channel-sidebar relative flex h-full shrink-0 flex-col border-r border-[var(--channel-sidebar-border,var(--border-subtle))] bg-[var(--channel-sidebar-bg,var(--secondary-bg))]',
                'pt-[env(safe-area-inset-top)] pb-0 md:pb-[env(safe-area-inset-bottom)]',
                !inSwipePanel &&
                    navMode === 'friends' &&
                    isNothingSelected &&
                    mobileHomeTab === 'friends' &&
                    'max-md:!w-auto max-md:!flex-1 max-md:shrink',
                !inSwipePanel &&
                    navMode === 'servers' &&
                    isNothingSelected &&
                    !isRolesView &&
                    !isChannelsView &&
                    'max-md:!w-auto max-md:!flex-1 max-md:shrink',
                !inSwipePanel &&
                    navMode === 'friends' &&
                    isNothingSelected &&
                    mobileHomeTab === 'requests' &&
                    'max-md:hidden',
                !inSwipePanel &&
                    navMode === 'servers' &&
                    (isRolesView || isChannelsView) &&
                    'max-md:hidden',
                !inSwipePanel && !isNothingSelected && 'max-md:hidden',
            )}
            style={{ width: inSwipePanel ? undefined : `${width}px` }}
        >
            <Box className="relative flex min-h-0 flex-1 flex-col">
                {navMode === 'friends' ? <FriendsSection /> : null}
                {navMode === 'servers' ? <ServerSection /> : null}
            </Box>

            {inSwipePanel ? (
                <>
                    <ActiveVoicePanel />
                    <MiniProfile />
                </>
            ) : null}

            <Resizer
                isResizing={isResizing}
                side="right"
                onMouseDown={handleMouseDown}
            />
        </Box>
    );
};
