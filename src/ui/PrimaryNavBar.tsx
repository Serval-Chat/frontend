import React from 'react';
import { cn } from '@/utils/cn';
import { Divider } from '@/ui/components/common/Divider';
import { HomeButton } from '@/ui/buttons/HomeButton';
import { SettingsButton } from '@/ui/buttons/SettingsButton';
import { ServerList } from '@/ui/components/servers/ServerList';

export const PrimaryNavBar: React.FC = () => {
    return (
        <nav
            className={cn(
                'h-full flex flex-col items-center py-3 gap-3',
                'bg-[--color-background]',
                'w-[72px] shrink-0'
            )}
        >
            <div>
                <HomeButton />
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
