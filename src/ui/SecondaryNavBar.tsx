import React from 'react';

import { useResizable } from '@/hooks/useResizable';
import { useAppSelector } from '@/store/hooks';
import { Resizer } from '@/ui/components/common/Resizer';
import { FriendsSection } from '@/ui/components/friends/FriendsSection';
import { Box } from '@/ui/components/layout/Box';
import { MiniProfile } from '@/ui/components/profile/MiniProfile';
import { ServerSection } from '@/ui/components/servers/ServerSection';
import { cn } from '@/utils/cn';

/**
 * @description Secondary navigation bar
 */
export const SecondaryNavBar: React.FC = () => {
    const navMode = useAppSelector((state) => state.nav.navMode);
    const { width, isResizing, handleMouseDown } = useResizable({
        initialWidth: 240,
        minWidth: 200,
        maxWidth: 480,
        storageKey: 'secondary-navbar-width',
        side: 'left',
    });

    return (
        <Box
            as="aside"
            className={cn(
                'h-full shrink-0 flex flex-col no-scrollbar bg-[var(--secondary-bg)] relative',
            )}
            style={{ width: `${width}px` }}
        >
            <Box className="flex-1 flex flex-col min-h-0 relative">
                {navMode === 'friends' && <FriendsSection />}
                {navMode === 'servers' && <ServerSection />}
            </Box>

            <MiniProfile />

            <Resizer
                isResizing={isResizing}
                side="right"
                onMouseDown={handleMouseDown}
            />
        </Box>
    );
};
