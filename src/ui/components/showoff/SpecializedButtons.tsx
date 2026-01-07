import React from 'react';

import { HomeButton } from '@/ui/buttons/HomeButton';
import { SettingsButton } from '@/ui/buttons/SettingsButton';

export const SpecializedButtons: React.FC = () => {
    return (
        <div className="p-4 bg-[--color-background] border border-[--color-border-subtle] rounded-md my-4 flex gap-4">
            <HomeButton />
            <SettingsButton />
        </div>
    );
};
