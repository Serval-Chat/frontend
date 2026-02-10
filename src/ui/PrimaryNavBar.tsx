import React, { useState } from 'react';

import { Compass, Home, Plus, Settings } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setNavMode, setSelectedFriendId } from '@/store/slices/navSlice';
import { Divider } from '@/ui/components/common/Divider';
import { IconButton } from '@/ui/components/common/IconButton';
import { Box } from '@/ui/components/layout/Box';
import { CreateServerModal } from '@/ui/components/servers/CreateServerModal';
import { JoinServerModal } from '@/ui/components/servers/JoinServerModal';
import { ServerList } from '@/ui/components/servers/ServerList';
import { SettingsModal } from '@/ui/components/settings/SettingsModal';
import { cn } from '@/utils/cn';

export const PrimaryNavBar: React.FC = () => {
    const dispatch = useAppDispatch();
    const navMode = useAppSelector((state) => state.nav.navMode);
    const [showSettings, setShowSettings] = useState(false);
    const [showCreateServer, setShowCreateServer] = useState(false);
    const [showJoinServer, setShowJoinServer] = useState(false);

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

            <Box>
                <IconButton
                    className="text-green-500 hover:text-green-400 bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-subtle-hover)]"
                    icon={Plus}
                    onClick={() => setShowCreateServer(true)}
                />
            </Box>

            <Box>
                <IconButton
                    className="text-[var(--color-text-subtle)] hover:text-[var(--color-text-normal)] bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-subtle-hover)]"
                    icon={Compass}
                    onClick={() => setShowJoinServer(true)}
                />
            </Box>

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
            <CreateServerModal
                isOpen={showCreateServer}
                onClose={() => setShowCreateServer(false)}
            />
            <JoinServerModal
                isOpen={showJoinServer}
                onClose={() => setShowJoinServer(false)}
            />
        </Box>
    );
};
