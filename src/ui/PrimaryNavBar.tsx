import React, { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Compass, Home, Plus, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { usePings } from '@/api/pings/pings.queries';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleMobileHomeTab } from '@/store/slices/navSlice';
import { useMobileSwipeContext } from '@/ui/MobileSwipeContext';
import { Divider } from '@/ui/components/common/Divider';
import { IconButton } from '@/ui/components/common/IconButton';
import { Tooltip } from '@/ui/components/common/Tooltip';
import { Box } from '@/ui/components/layout/Box';
import { PingInbox } from '@/ui/components/pings/PingInbox';
import { CreateServerModal } from '@/ui/components/servers/CreateServerModal';
import { JoinServerModal } from '@/ui/components/servers/JoinServerModal';
import { ServerList } from '@/ui/components/servers/ServerList';
import { SettingsModal } from '@/ui/components/settings/SettingsModal';
import { cn } from '@/utils/cn';

export const PrimaryNavBar: React.FC = () => {
    const { navMode, selectedFriendId, selectedChannelId } = useAppSelector(
        (state) => state.nav,
    );
    const unreadDms = useAppSelector((state) => state.unread.unreadDms);
    const { data: pingsData } = usePings();
    const totalUnreadDms = Object.values(unreadDms).reduce(
        (acc, count) => acc + (typeof count === 'number' ? count : 0),
        0,
    );
    const pingCount = pingsData?.pings?.length || 0;

    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [showCreateServer, setShowCreateServer] = useState(false);
    const [showJoinServer, setShowJoinServer] = useState(false);
    const [showInbox, setShowInbox] = useState(false);

    const showSettings = location.pathname.startsWith('/chat/@setting');
    const inSwipePanel = useMobileSwipeContext();

    const isChatActive = !!selectedFriendId || !!selectedChannelId;

    const handleHomeClick = (): void => {
        if (navMode === 'friends' && location.pathname === '/chat/@me') {
            dispatch(toggleMobileHomeTab());
        } else {
            void navigate('/chat/@me');
        }
    };

    const handleSettingsClick = (): void => {
        void navigate('/chat/@setting/my-account');
    };

    const handleCloseSettings = (): void => {
        // Navigate back to the previous state or @me
        void navigate(-1);
    };

    return (
        <Box
            as="nav"
            className={cn(
                'relative z-50 flex h-full flex-col items-center gap-3',
                'pt-[calc(0.75rem+env(safe-area-inset-top))] pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
                'bg-[--color-background]',
                'w-[72px] shrink-0',
                !inSwipePanel && isChatActive && 'max-md:hidden',
            )}
        >
            <Box>
                <Tooltip content="Direct Messages">
                    <IconButton
                        badgeCount={totalUnreadDms}
                        icon={Home}
                        isActive={navMode === 'friends'}
                        onClick={handleHomeClick}
                    />
                </Tooltip>
            </Box>

            <Divider />

            <ServerList />

            <Box>
                <Tooltip content="Add a Server">
                    <IconButton
                        className="bg-bg-subtle text-green-500 hover:bg-bg-subtle-hover hover:text-green-400"
                        icon={Plus}
                        onClick={() => setShowCreateServer(true)}
                    />
                </Tooltip>
            </Box>

            <Box>
                <Tooltip content="Explore Servers">
                    <IconButton
                        className="bg-bg-subtle text-text-subtle hover:bg-bg-subtle-hover hover:text-text-normal"
                        icon={Compass}
                        onClick={() => setShowJoinServer(true)}
                    />
                </Tooltip>
            </Box>

            <Divider />

            <Box className="relative">
                <Tooltip content="Inbox">
                    <IconButton
                        badgeCount={pingCount}
                        icon={Bell}
                        isActive={showInbox}
                        onClick={() => setShowInbox(!showInbox)}
                    />
                </Tooltip>

                <AnimatePresence>
                    {showInbox && (
                        <motion.div
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            className="absolute bottom-0 left-[calc(100%+12px)] z-50 origin-bottom-left"
                            exit={{ opacity: 0, x: -10, scale: 0.95 }}
                            initial={{ opacity: 0, x: -10, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                        >
                            <PingInbox onClose={() => setShowInbox(false)} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>

            <Box>
                <Tooltip content="User Settings">
                    <IconButton icon={Settings} onClick={handleSettingsClick} />
                </Tooltip>
            </Box>

            <SettingsModal
                isOpen={showSettings}
                onClose={handleCloseSettings}
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
