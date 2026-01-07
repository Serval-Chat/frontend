import React from 'react';
import { cn } from '@/utils/cn';
import { Divider } from '@/ui/components/common/Divider';
import { HomeButton } from '@/ui/buttons/HomeButton';
import { SettingsButton } from '@/ui/buttons/SettingsButton';
import { ServerList } from '@/ui/components/servers/ServerList';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setNavMode } from '@/store/slices/navSlice';

export const PrimaryNavBar: React.FC = () => {
    const dispatch = useAppDispatch();
    const navMode = useAppSelector((state) => state.nav.navMode);

    return (
        <nav
            className={cn(
                'h-full flex flex-col items-center py-3 gap-3',
                'bg-[--color-background]',
                'w-[72px] shrink-0'
            )}
        >
            <div>
                <HomeButton
                    isActive={navMode === 'friends'}
                    onClick={() => dispatch(setNavMode('friends'))}
                />
            </div>

            <Divider />

            <ServerList />

            <Divider />

            <div>
                <SettingsButton />
            </div>
        </nav>
    );
};
