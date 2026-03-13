import React, { useCallback, useEffect, useRef, useState } from 'react';

import { animate, useMotionValue } from 'framer-motion';
import { motion } from 'framer-motion';
import { Outlet, useNavigate } from 'react-router-dom';

import { useMe } from '@/api/users/users.queries';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
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
export const Chat: React.FC = () => {
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
    } = useAppSelector((state) => state.nav);

    const [isMobile, setIsMobile] = useState(isMobileViewport);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const onChange = (e: MediaQueryListEvent): void =>
            setIsMobile(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
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
    useEffect(() => {
        targetXRef.current = targetX();
    }, [targetX]);

    const x = useMotionValue(0);

    useEffect(() => {
        void animate(x, targetX(), SPRING);
    }, [targetX, x]);

    const dragStartXRef = useRef(0);
    const isMobileRef = useRef(isMobile);
    useEffect(() => {
        isMobileRef.current = isMobile;
    }, [isMobile]);

    const showMobileMemberListRef = useRef(showMobileMemberList);
    useEffect(() => {
        showMobileMemberListRef.current = showMobileMemberList;
    }, [showMobileMemberList]);

    const handleDragStart = useCallback(() => {
        if (!isMobileRef.current) return;
        dragStartXRef.current = x.get();
    }, [x]);

    const handleDragMove = useCallback(
        (deltaX: number) => {
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
        (_deltaX: number) => {
            if (!isMobileRef.current) return;
            setTimeout(() => {
                void animate(x, targetXRef.current, SPRING);
            }, 0);
        },
        [x],
    );

    const handleSwipeRight = useCallback(() => {
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

    const handleSwipeLeft = useCallback(() => {
        if (!isMobileRef.current) return;
        if (!selectedChannelId && navMode === 'servers' && selectedServerId) {
            const lastChannel = lastOpenedChannelByServer[selectedServerId];
            if (lastChannel) {
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
            <Box className="flex h-[100dvh] w-full overflow-hidden bg-[var(--chat-bg)]">
                <Outlet />
                <PrimaryNavBar />
                <SecondaryNavBar />
                <MainContent />
                <TertiarySidebar />
            </Box>
        );
    }

    return (
        <Box
            className="relative h-[100dvh] w-full overflow-hidden bg-[var(--chat-bg)]"
            ref={swipeRef}
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
            <TertiarySidebar />
        </Box>
    );
};
