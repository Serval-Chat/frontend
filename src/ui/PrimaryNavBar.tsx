import React from 'react';
import { cn } from '@/utils/cn';
import { Divider } from '@/ui/components/Divider';
import { HomeButton } from '@/ui/buttons/HomeButton';
import { SettingsButton } from '@/ui/buttons/SettingsButton';

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

            <div className="flex-1 w-full flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-[--radius-md] bg-[--color-bg-subtle] hover:bg-[--color-primary] transition-colors duration-200 cursor-pointer" />
                <div className="w-12 h-12 rounded-[--radius-md] bg-[--color-bg-subtle] hover:bg-[--color-primary] transition-colors duration-200 cursor-pointer" />
            </div>

            <Divider />

            <div>
                <SettingsButton />
            </div>
        </nav>
    );
};
