import React from 'react';

import { useAppSelector } from '@/store/hooks';
import { FriendList } from '@/ui/components/friends/FriendList';
import { cn } from '@/utils/cn';

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
            <div className="flex-1">
                {navMode === 'friends' && <FriendList />}
                {navMode === 'servers' && (
                    <div className="p-4 text-foreground-muted text-sm italic">
                        Server navigation coming soon...
                    </div>
                )}
            </div>
        </aside>
    );
};
