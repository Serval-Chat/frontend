import React from 'react';

import { useAppSelector } from '@/store/hooks';
import { FriendsSection } from '@/ui/components/friends/FriendsSection';
import { cn } from '@/utils/cn';

const ServersPlaceholder = () => (
    <div className="p-4 text-foreground-muted text-sm italic">
        Server navigation coming soon...
    </div>
);

/**
 * @description Secondary navigation bar
 */
export const SecondaryNavBar: React.FC = () => {
    const navMode = useAppSelector((state) => state.nav.navMode);

    return (
        <aside
            className={cn(
                'h-full w-[240px] shrink-0 flex flex-col overflow-y-auto no-scrollbar',
                'bg-linear-to-r from-[--color-background] from-0% to-bg-secondary to-10%'
            )}
        >
            <div className="flex-1 flex flex-col">
                {navMode === 'friends' && <FriendsSection />}
                {navMode === 'servers' && <ServersPlaceholder />}
            </div>
        </aside>
    );
};
