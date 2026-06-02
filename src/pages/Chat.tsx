import { useCallback, useEffect, useRef, useState } from 'react';

import { animate, useMotionValue } from 'framer-motion';
import { motion } from 'framer-motion';
import { Outlet, useNavigate } from 'react-router-dom';

import { useMe } from '@/api/users/users.queries';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useAppDispatch, useAppShallowSelector } from '@/store/hooks';
import {
    setSelectedChannelId,
    setSelectedFriendId,
    toggleMobileHomeTab,
    toggleMobileMemberList,
} from '@/store/slices/navSlice';
import { MobileSwipeContext } from '@/ui/MobileSwipeContext';
import { PrimaryNavBar } from '@/ui/PrimaryNavBar';
import { SecondaryNavBar } from '@/ui/SecondaryNavBar';
import { TertiarySidebar } from '@/ui/TertiarySidebar';
import { Box } from '@/ui/components/layout/Box';
import { MainContent } from '@/ui/components/layout/MainContent';

const isMobileViewport = (): boolean =>
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 767px)').matches;

const SPRING = { type: 'spring', stiffness: 300, damping: 35 } as const;

/**
 * @description Chat page with smooth swipe gesture navigation on mobile.
 */
export const Chat = () => {
    const { data: user, error } = useMe();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const {
        selectedFriendId,
        selectedServerId,
        selectedChannelId,
        showMobileMemberList,
        navMode,
        mobileHomeTab,
        lastSelectedFriendId,
        lastOpenedChannelByServer,
        isSplitViewActive,
    } = useAppShallowSelector((state) => ({
        selectedFriendId: state.nav.selectedFriendId,
        selectedServerId: state.nav.selectedServerId,
        selectedChannelId: state.nav.selectedChannelId,
        showMobileMemberList: state.nav.showMobileMemberList,
        navMode: state.nav.navMode,
        mobileHomeTab: state.nav.mobileHomeTab,
        lastSelectedFriendId: state.nav.lastSelectedFriendId,
        lastOpenedChannelByServer: state.nav.lastOpenedChannelByServer,
        isSplitViewActive: !!(
            state.nav.splitView.left || state.nav.splitView.right
        ),
    }));

    const [isMobile, setIsMobile] = useState(isMobileViewport);
    const [visualViewportBounds, setVisualViewportBounds] = useState({
        top: 0,
        height:
            typeof window !== 'undefined'
                ? window.visualViewport?.height || window.innerHeight
                : 0,
    });
    useEffect((): (() => void) => {
        const mq = window.matchMedia('(max-width: 767px)');
        const onChange = (e: MediaQueryListEvent): void =>
            setIsMobile(e.matches);
        mq.addEventListener('change', onChange);
        return (): void => mq.removeEventListener('change', onChange);
    }, []);

    useEffect((): (() => void) | undefined => {
        if (!isMobile) return;

        const viewport = window.visualViewport;

        const updateBounds = (): void => {
            setVisualViewportBounds({
                top: viewport?.offsetTop ?? 0,
                height: viewport?.height ?? window.innerHeight,
            });
            window.scrollTo(0, 0);
        };

        updateBounds();
        viewport?.addEventListener('resize', updateBounds);
        viewport?.addEventListener('scroll', updateBounds);
        window.addEventListener('resize', updateBounds);

        return (): void => {
            viewport?.removeEventListener('resize', updateBounds);
            viewport?.removeEventListener('scroll', updateBounds);
            window.removeEventListener('resize', updateBounds);
        };
    }, [isMobile]);

    useEffect((): void => {
        if (error) console.error('Error fetching user:', error);
    }, [user, error]);

    // 0 = list view, 1 = chat view OR pending requests view
    const inChat = !!(selectedFriendId || selectedChannelId);
    const panelIndex = inChat
        ? 1
        : navMode === 'friends' && mobileHomeTab === 'requests'
          ? 1
          : 0;
    const targetX = useCallback(
        (): number => -panelIndex * window.innerWidth,
        [panelIndex],
    );

    const targetXRef = useRef(targetX());
    useEffect((): void => {
        targetXRef.current = targetX();
    }, [targetX]);

    const x = useMotionValue(0);

    useEffect((): void => {
        void animate(x, targetX(), SPRING);
    }, [targetX, x]);

    const dragStartXRef = useRef(0);
    const isMobileRef = useRef(isMobile);
    useEffect((): void => {
        isMobileRef.current = isMobile;
    }, [isMobile]);

    const showMobileMemberListRef = useRef(showMobileMemberList);
    useEffect((): void => {
        showMobileMemberListRef.current = showMobileMemberList;
    }, [showMobileMemberList]);

    const handleDragStart = useCallback((): void => {
        if (!isMobileRef.current) return;
        dragStartXRef.current = x.get();
    }, [x]);

    const handleDragMove = useCallback(
        (deltaX: number): void => {
            if (!isMobileRef.current) return;
            if (showMobileMemberListRef.current) return;
            const base = dragStartXRef.current;
            const rawX = base + deltaX;

            const minX = -window.innerWidth;
            const maxX = 0;
            x.set(Math.max(minX, Math.min(maxX, rawX)));
        },
        [x],
    );

    const handleDragEnd = useCallback(
        (_deltaX: number): void => {
            if (!isMobileRef.current) return;
            setTimeout((): void => {
                void animate(x, targetXRef.current, SPRING);
            }, 0);
        },
        [x],
    );

    const handleSwipeRight = useCallback((): void => {
        if (!isMobileRef.current) return;

        if (showMobileMemberList) {
            dispatch(toggleMobileMemberList());
            return;
        }

        if (selectedFriendId) {
            dispatch(setSelectedFriendId(null));
            void navigate('/chat/@me');
        } else if (selectedChannelId && selectedServerId) {
            dispatch(setSelectedChannelId(null));
            void navigate(`/chat/@server/${selectedServerId}`);
        } else if (
            navMode === 'friends' &&
            mobileHomeTab === 'requests' &&
            !selectedFriendId
        ) {
            dispatch(toggleMobileHomeTab());
        } else if (
            navMode === 'friends' &&
            mobileHomeTab === 'friends' &&
            !selectedFriendId &&
            lastSelectedFriendId
        ) {
            void navigate(`/chat/@user/${lastSelectedFriendId}`);
        }
    }, [
        showMobileMemberList,
        selectedFriendId,
        selectedChannelId,
        selectedServerId,
        navMode,
        mobileHomeTab,
        lastSelectedFriendId,
        dispatch,
        navigate,
    ]);

    const handleSwipeLeft = useCallback((): void => {
        if (!isMobileRef.current) return;
        if (!selectedChannelId && navMode === 'servers' && selectedServerId) {
            const lastChannel = lastOpenedChannelByServer[selectedServerId];
            if (lastChannel) {
                dispatch(setSelectedChannelId(lastChannel));
                void navigate(
                    `/chat/@server/${selectedServerId}/channel/${lastChannel}`,
                );
                return;
            }
        }

        if (
            navMode === 'friends' &&
            !selectedFriendId &&
            mobileHomeTab === 'friends'
        ) {
            dispatch(toggleMobileHomeTab());
            return;
        }

        if (selectedChannelId && selectedServerId && !showMobileMemberList) {
            dispatch(toggleMobileMemberList());
        }
    }, [
        selectedChannelId,
        selectedServerId,
        selectedFriendId,
        showMobileMemberList,
        navMode,
        mobileHomeTab,
        lastOpenedChannelByServer,
        dispatch,
        navigate,
    ]);

    const { ref: swipeRef } = useSwipeGesture({
        enabled: isMobile,
        onDragStart: handleDragStart,
        onDragMove: handleDragMove,
        onDragEnd: handleDragEnd,
        onSwipeRight: handleSwipeRight,
        onSwipeLeft: handleSwipeLeft,
    });

    if (!isMobile) {
        return (
            <Box className="chat-background fixed inset-0 flex w-full overflow-hidden overscroll-none">
                <Outlet />
                <PrimaryNavBar />
                <SecondaryNavBar />
                <MainContent />
                {!isSplitViewActive && <TertiarySidebar />}
            </Box>
        );
    }

    return (
        <Box
            className="chat-background fixed right-0 left-0 w-full overflow-hidden overscroll-none"
            ref={swipeRef}
            style={{
                top: visualViewportBounds.top,
                height: visualViewportBounds.height,
            }}
        >
            <Outlet />
            <MobileSwipeContext.Provider value>
                <motion.div
                    className="flex h-full"
                    style={{
                        x,
                        width: '200vw',
                        willChange: 'transform',
                    }}
                >
                    {/* Panel 0: List (PrimaryNavBar + SecondaryNavBar) */}
                    <div className="flex h-full w-screen shrink-0 overflow-hidden">
                        <PrimaryNavBar />
                        <div className="h-full min-w-0 flex-1">
                            <SecondaryNavBar />
                        </div>
                    </div>

                    {/* Panel 1: Chat (MainContent) */}
                    <div className="flex h-full w-screen shrink-0 flex-col overflow-hidden">
                        <MainContent />
                    </div>
                </motion.div>
            </MobileSwipeContext.Provider>

            {/* TertiarySidebar: fixed overlay, slides in from right independently */}
            {!isSplitViewActive && <TertiarySidebar />}
        </Box>
    );
};
