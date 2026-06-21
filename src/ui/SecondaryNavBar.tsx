import { useLocation } from 'react-router-dom';

import { useResizable } from '@/hooks/useResizable';
import { useAppShallowSelector } from '@/store/hooks';
import { useMobileSwipeContext } from '@/ui/MobileSwipeContext';
import { ActiveVoicePanel } from '@/ui/components/chat/ActiveVoicePanel';
import { Resizer } from '@/ui/components/common/Resizer';
import { FriendsSection } from '@/ui/components/friends/FriendsSection';
import { Box } from '@/ui/components/layout/Box';
import { MiniProfile } from '@/ui/components/profile/MiniProfile';
import { ServerSection } from '@/ui/components/servers/ServerSection';
import { cn } from '@/utils/cn';

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

    const isRolesView = location.pathname.endsWith('/self-roles');
    const isChannelsView = location.pathname.endsWith(
        '/channels-and-categories',
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
                {navMode === 'friends' && <FriendsSection />}
                {navMode === 'servers' && <ServerSection />}
            </Box>

            <ActiveVoicePanel />
            <MiniProfile />

            <Resizer
                isResizing={isResizing}
                side="right"
                onMouseDown={handleMouseDown}
            />
        </Box>
    );
};
