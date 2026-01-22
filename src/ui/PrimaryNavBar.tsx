import React, { useState } from 'react';

import { Home, Settings } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setNavMode, setSelectedFriendId } from '@/store/slices/navSlice';
import { Divider } from '@/ui/components/common/Divider';
import { IconButton } from '@/ui/components/common/IconButton';
import { Box } from '@/ui/components/layout/Box';
import { ServerList } from '@/ui/components/servers/ServerList';
import { SettingsModal } from '@/ui/components/settings/SettingsModal';
import { cn } from '@/utils/cn';

export const PrimaryNavBar: React.FC = () => {
    const dispatch = useAppDispatch();
    const navMode = useAppSelector((state) => state.nav.navMode);
    const [showSettings, setShowSettings] = useState(false);

    const handleHomeClick = (): void => {
        if (navMode === 'friends') {
            dispatch(setSelectedFriendId(null));
        } else {
            dispatch(setNavMode('friends'));
        }
    };

    return (
        <Box
            as="nav"
            className={cn(
                'h-full flex flex-col items-center py-3 gap-3',
                'bg-[--color-background]',
                'w-[72px] shrink-0',
            )}
        >
            <Box>
                <IconButton
                    icon={Home}
                    isActive={navMode === 'friends'}
                    onClick={handleHomeClick}
                />
            </Box>

            <Divider />

            <ServerList />

            <Divider />

            <Box>
                <IconButton
                    icon={Settings}
                    onClick={() => setShowSettings(true)}
                />
            </Box>

            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />
        </Box>
    );
};
