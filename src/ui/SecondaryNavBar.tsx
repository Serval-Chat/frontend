import React from 'react';

import { useAppSelector } from '@/store/hooks';
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

    return (
        <Box
            as="aside"
            className={cn(
                'h-full w-[240px] shrink-0 flex flex-col no-scrollbar bg-[var(--secondary-bg)]',
            )}
        >
            <Box className="flex-1 flex flex-col min-h-0 relative">
                {navMode === 'friends' && <FriendsSection />}
                {navMode === 'servers' && <ServerSection />}
            </Box>

            <MiniProfile />
        </Box>
    );
};
