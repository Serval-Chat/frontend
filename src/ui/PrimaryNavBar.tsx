import React, { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Compass, Home, Plus, Settings, Telescope } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { usePings } from '@/api/pings/pings.queries';
import {
    useAppDispatch,
    useAppSelector,
    useAppShallowSelector,
} from '@/store/hooks';
import { setMobileHomeTab } from '@/store/slices/navSlice';
import { useMobileSwipeContext } from '@/ui/MobileSwipeContext';
import { Divider } from '@/ui/components/common/Divider';
import { IconButton } from '@/ui/components/common/IconButton';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Tooltip } from '@/ui/components/common/Tooltip';
import { Box } from '@/ui/components/layout/Box';
import { ServerList } from '@/ui/components/servers/ServerList';
import { cn } from '@/utils/cn';

const CreateServerModal = React.lazy(() =>
    import('@/ui/components/servers/CreateServerModal').then((m) => ({
        default: m.CreateServerModal,
    })),
);

const JoinServerModal = React.lazy(() =>
    import('@/ui/components/servers/JoinServerModal').then((m) => ({
        default: m.JoinServerModal,
    })),
);

const ServerDiscoveryModal = React.lazy(() =>
    import('@/ui/components/servers/ServerDiscoveryModal').then((m) => ({
        default: m.ServerDiscoveryModal,
    })),
);

const PingInbox = React.lazy(() =>
    import('@/ui/components/pings/PingInbox').then((m) => ({
        default: m.PingInbox,
    })),
);

const SettingsModal = React.lazy(() =>
    import('@/ui/components/settings/SettingsModal').then((m) => ({
        default: m.SettingsModal,
    })),
);

const SettingsModalLoading = () => (
    <Box className="fixed inset-0 z-modal flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <Box className="flex h-[100dvh] w-screen items-center justify-center bg-background md:h-[92vh] md:max-h-[900px] md:w-[96%] md:max-w-[1200px] md:rounded-xl md:border md:border-border-subtle">
            <LoadingSpinner size="lg" />
        </Box>
    </Box>
);

export const PrimaryNavBar = () => {
    const { navMode, selectedFriendId, selectedChannelId } =
        useAppShallowSelector((state) => ({
            navMode: state.nav.navMode,
            selectedFriendId: state.nav.selectedFriendId,
            selectedChannelId: state.nav.selectedChannelId,
        }));
    const unreadDms = useAppSelector(
        (state): Record<string, number> => state.unread.unreadDms,
    );
    const { data: pingsData } = usePings();
    const totalUnreadDms = Object.values(unreadDms).reduce(
        (acc, count): number => acc + (typeof count === 'number' ? count : 0),
        0,
    );
    const pingCount = pingsData?.pings?.length || 0;

    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [showCreateServer, setShowCreateServer] = useState(false);
    const [showJoinServer, setShowJoinServer] = useState(false);
    const [showDiscovery, setShowDiscovery] = useState(false);
    const [showInbox, setShowInbox] = useState(false);
    const [settingsSectionOverride, setSettingsSectionOverride] = useState<
        string | null
    >(null);

    const showSettings = location.pathname.startsWith('/chat/@setting');
    const inSwipePanel = useMobileSwipeContext();

    const isChatActive = !!selectedFriendId || !!selectedChannelId;

    const handleHomeClick = (): void => {
        dispatch(setMobileHomeTab('friends'));
        if (navMode !== 'friends' || location.pathname !== '/chat/@me') {
            void navigate('/chat/@me');
        }
    };

    const handleSettingsClick = (): void => {
        setSettingsSectionOverride('account');
        void navigate('/chat/@setting/my-account');
    };

    const handleCloseSettings = (): void => {
        // Navigate back to the previous state or @me
        void navigate(-1);
    };

    React.useEffect((): void => {
        if (!showSettings) {
            setSettingsSectionOverride(null);
            return;
        }

        if (location.pathname === '/chat/@setting/my-account') {
            setSettingsSectionOverride(null);
        }
    }, [location.pathname, showSettings]);

    return (
        <Box
            as="nav"
            className={cn(
                'relative z-50 flex h-full flex-col items-center gap-3 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:hidden after:h-[env(safe-area-inset-bottom)] after:bg-[--color-background] max-md:after:block',
                showInbox && 'z-[var(--z-index-popover)]',
                'pt-[calc(0.75rem+env(safe-area-inset-top))] pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
                'pride-glass-strong bg-[--color-background]',
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
                        onClick={(): void => setShowCreateServer(true)}
                    />
                </Tooltip>
            </Box>

            <Box>
                <Tooltip content="Join Server">
                    <IconButton
                        className="bg-bg-subtle text-text-subtle hover:bg-bg-subtle-hover hover:text-text-normal"
                        icon={Compass}
                        onClick={(): void => setShowJoinServer(true)}
                    />
                </Tooltip>
            </Box>

            <Box>
                <Tooltip content="Server Discovery">
                    <IconButton
                        className="bg-bg-subtle text-text-subtle hover:bg-bg-subtle-hover hover:text-text-normal"
                        icon={Telescope}
                        isActive={showDiscovery}
                        onClick={(): void => setShowDiscovery(true)}
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
                        onClick={(): void => setShowInbox(!showInbox)}
                    />
                </Tooltip>

                <AnimatePresence>
                    {showInbox && (
                        <motion.div
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            className="absolute bottom-0 left-[calc(100%+12px)] z-[var(--z-index-popover)] origin-bottom-left"
                            exit={{ opacity: 0, x: -10, scale: 0.95 }}
                            initial={{ opacity: 0, x: -10, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                        >
                            <React.Suspense fallback={null}>
                                <PingInbox
                                    onClose={(): void => setShowInbox(false)}
                                />
                            </React.Suspense>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>

            <Box>
                <Tooltip content="User Settings">
                    <IconButton icon={Settings} onClick={handleSettingsClick} />
                </Tooltip>
            </Box>

            {showSettings && (
                <React.Suspense fallback={<SettingsModalLoading />}>
                    <SettingsModal
                        isOpen={showSettings}
                        sectionOverride={settingsSectionOverride}
                        onClose={handleCloseSettings}
                    />
                </React.Suspense>
            )}
            {showCreateServer && (
                <React.Suspense fallback={null}>
                    <CreateServerModal
                        isOpen={showCreateServer}
                        onClose={(): void => setShowCreateServer(false)}
                        onSwitchToJoin={(): void => {
                            setShowCreateServer(false);
                            setShowJoinServer(true);
                        }}
                    />
                </React.Suspense>
            )}
            {showJoinServer && (
                <React.Suspense fallback={null}>
                    <JoinServerModal
                        isOpen={showJoinServer}
                        onClose={(): void => setShowJoinServer(false)}
                    />
                </React.Suspense>
            )}
            {showDiscovery && (
                <React.Suspense fallback={null}>
                    <ServerDiscoveryModal
                        isOpen={showDiscovery}
                        onClose={(): void => setShowDiscovery(false)}
                    />
                </React.Suspense>
            )}
        </Box>
    );
};
