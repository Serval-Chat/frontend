import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { AnimatePresence, m } from 'framer-motion';
import { Hash, Pin, Search, Users, Volume2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { usePinnedMessages } from '@/api/chat/chat.queries';
import type { ChatMessage } from '@/api/chat/chat.types';
import { useFriends } from '@/api/friends/friends.queries';
import type { Channel } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { UserProfilePicture } from '@/features/users/UserProfilePicture';
import { useAppDispatch, useAppShallowSelector } from '@/store/hooks';
import {
    setSelectedChannelId,
    setSelectedFriendId,
    toggleDesktopMemberList,
    toggleMobileMemberList,
} from '@/store/slices/navSlice';
import { Box } from '@/ui/primitives/Box';
import { Pressable } from '@/ui/primitives/Pressable';
import { Text } from '@/ui/primitives/Text';
import { ICON_MAP } from '@/ui/utils/iconMap';
import { cn } from '@/utils/cn';
import { resolveDisplayName } from '@/utils/displayName';

import { PinsDrawer } from './PinsDrawer';

export const CHAT_SEARCH_SIDEBAR_WIDTH = 360;

interface ChatHeaderMemberListProps {
    /** Whether the member list panel is currently open. Falls back to redux nav state when omitted. */
    isOpen?: boolean;
    /** Hides the member list toggle button entirely (e.g. it's already shown elsewhere). */
    hideButton?: boolean;
    onToggle?: () => void;
}

interface ChatHeaderProps {
    selectedFriendId: string | null;
    friendUser?: User;
    selectedChannel?: Channel;
    onTogglePins?: () => void;
    memberList?: ChatHeaderMemberListProps;
    showPins?: boolean;
    actions?: React.ReactNode;
    isSearchOpen?: boolean;
    onToggleSearch?: () => void;
    onHeightChange?: (height: number, lowerEdge: number) => void;
    hasVisibleStickyMessage?: boolean;
    isViewingOlderMessages?: boolean;
}

interface HeaderContour {
    clipPath: string;
    borderPath: string;
    lowerEdge: number;
    width: number;
    height: number;
}

/**
 * @description Header for the main chat area, displaying the current conversation info.
 */
export const ChatHeader = ({
    selectedFriendId,
    friendUser,
    selectedChannel,
    onTogglePins,
    memberList,
    showPins,
    actions,
    isSearchOpen,
    onToggleSearch,
    onHeightChange,
    hasVisibleStickyMessage = false,
    isViewingOlderMessages = false,
}: ChatHeaderProps) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const {
        selectedServerId,
        selectedChannelId,
        showMobileMemberList,
        showDesktopMemberList,
    } = useAppShallowSelector((state) => ({
        selectedServerId: state.nav.selectedServerId,
        selectedChannelId: state.nav.selectedChannelId,
        showMobileMemberList: state.nav.showMobileMemberList,
        showDesktopMemberList: state.nav.showDesktopMemberList,
    }));

    const [descExpanded, setDescExpanded] = useState(false);
    const pinButtonRef = useRef<HTMLButtonElement>(null);
    const headerRef = useRef<HTMLElement>(null);
    const channelNameRef = useRef<HTMLDivElement>(null);
    const descriptionRef = useRef<HTMLSpanElement>(null);
    const actionsRef = useRef<HTMLDivElement>(null);
    const [headerContour, setHeaderContour] = useState<HeaderContour | null>(
        null,
    );

    const { data: me } = useMe();
    const { data: friends } = useFriends();
    const localNickname = Array.isArray(friends)
        ? friends.find((f): boolean => f.id === selectedFriendId)?.nickname
        : undefined;
    const { data: pins } = usePinnedMessages(
        selectedServerId,
        selectedChannelId,
    );
    const [lastViewedAt, setLastViewedAt] = useState<number>(0);

    useLayoutEffect((): (() => void) | undefined => {
        const header = headerRef.current;
        if (!header || !onHeightChange) return undefined;

        const reportHeight = (): void => {
            const height = header.getBoundingClientRect().height;
            onHeightChange(height, headerContour?.lowerEdge ?? height);
        };
        reportHeight();

        const observer = new ResizeObserver(reportHeight);
        observer.observe(header);
        if (actionsRef.current) observer.observe(actionsRef.current);
        return (): void => observer.disconnect();
    }, [headerContour?.lowerEdge, onHeightChange]);

    // Sync lastViewedAt from localStorage
    useEffect((): (() => void) | undefined => {
        if (!me?.id || !selectedChannelId) return;

        const key = `serchat_pins_last_viewed_${me.id}_${selectedChannelId}`;
        const update = (): void => {
            const saved = localStorage.getItem(key);
            setLastViewedAt(saved ? Number.parseInt(saved, 10) : 0);
        };

        update();
        globalThis.addEventListener('storage', update);
        return (): void => {
            globalThis.removeEventListener('storage', update);
        };
    }, [me?.id, selectedChannelId]);

    const hasUnreadPins = React.useMemo((): boolean => {
        if (!pins || pins.length === 0 || showPins) return false;
        return pins.some(
            (p: ChatMessage): boolean =>
                new Date(p.createdAt).getTime() > lastViewedAt,
        );
    }, [pins, lastViewedAt, showPins]);

    const hasDescription = !selectedFriendId && !!selectedChannel?.description;
    const hasStatus = !!selectedFriendId && !!friendUser?.customStatus?.text;
    const showSecondary = hasDescription || hasStatus;

    useLayoutEffect((): (() => void) | undefined => {
        const header = headerRef.current;
        const channelName = channelNameRef.current;
        const description = descriptionRef.current;
        const actionsElement = actionsRef.current;
        if (
            !hasDescription ||
            hasVisibleStickyMessage ||
            isViewingOlderMessages ||
            descExpanded ||
            !header ||
            !channelName ||
            !description ||
            !actionsElement
        ) {
            setHeaderContour(null);
            return undefined;
        }

        const getTextRight = (element: HTMLElement): number => {
            const bounds = element.getBoundingClientRect();
            const text = element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
            const style = getComputedStyle(element);
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context || !text) return bounds.left;

            context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
            const letterSpacing =
                style.letterSpacing === 'normal'
                    ? 0
                    : Number.parseFloat(style.letterSpacing);
            const textWidth =
                context.measureText(text).width +
                (Number.isFinite(letterSpacing)
                    ? letterSpacing * Math.max(0, text.length - 1)
                    : 0);
            return bounds.left + Math.min(textWidth, element.clientWidth);
        };

        const updateContour = (): void => {
            const headerBounds = header.getBoundingClientRect();
            const actionsBounds = actionsElement.getBoundingClientRect();
            const width = header.clientWidth;
            const height = header.clientHeight;
            const actionsLeft = actionsBounds.left - headerBounds.left;
            const textRight =
                Math.max(getTextRight(channelName), getTextRight(description)) -
                headerBounds.left;
            const curveStart = Math.round(textRight + 4);
            const curveEnd = Math.min(curveStart + 72, actionsLeft - 8);
            const rightEdge = Math.round(
                actionsBounds.bottom - headerBounds.top + 4,
            );

            if (
                width <= 0 ||
                height <= 0 ||
                curveEnd - curveStart < 32 ||
                height - rightEdge < 8
            ) {
                setHeaderContour(null);
                return;
            }

            const endX = Math.round(curveEnd);
            const startX = Math.round(curveStart);
            const rightY = Math.min(rightEdge, height);
            const curveHandle = (endX - startX) * 0.45;
            const asPercent = (value: number, size: number): string =>
                `${((value / size) * 100).toFixed(3)}%`;
            const curvePoints: string[] = [];
            for (let sample = 15; sample > 0; sample -= 1) {
                const t = sample / 16;
                const inverseT = 1 - t;
                const x =
                    inverseT ** 3 * startX +
                    3 * inverseT ** 2 * t * (startX + curveHandle) +
                    3 * inverseT * t ** 2 * (endX - curveHandle) +
                    t ** 3 * endX;
                const y =
                    inverseT ** 3 * height +
                    3 * inverseT ** 2 * t * height +
                    3 * inverseT * t ** 2 * rightY +
                    t ** 3 * rightY;
                curvePoints.push(
                    `${asPercent(x, width)} ${asPercent(y, height)}`,
                );
            }
            const clipPath = `polygon(0 0, 100% 0, 100% ${asPercent(rightY, height)}, ${asPercent(endX, width)} ${asPercent(rightY, height)}, ${curvePoints.join(', ')}, ${asPercent(startX, width)} 100%, 0 100%)`;
            const borderPath = `M 0 ${height - 0.5} H ${startX} C ${startX + curveHandle} ${height - 0.5}, ${endX - curveHandle} ${rightY - 0.5}, ${endX} ${rightY - 0.5} H ${width}`;
            const nextContour = {
                clipPath,
                borderPath,
                lowerEdge: rightY,
                width,
                height,
            };

            setHeaderContour(
                (current): HeaderContour =>
                    current?.clipPath === nextContour.clipPath &&
                    current.borderPath === nextContour.borderPath &&
                    current.lowerEdge === nextContour.lowerEdge &&
                    current.width === nextContour.width &&
                    current.height === nextContour.height
                        ? current
                        : nextContour,
            );
        };

        updateContour();
        const observer = new ResizeObserver(updateContour);
        observer.observe(header);
        observer.observe(channelName);
        observer.observe(description);
        observer.observe(actionsElement);
        window.addEventListener('resize', updateContour);

        return (): void => {
            observer.disconnect();
            window.removeEventListener('resize', updateContour);
        };
    }, [
        hasDescription,
        hasVisibleStickyMessage,
        isViewingOlderMessages,
        descExpanded,
        selectedChannel?.description,
        selectedChannel?.name,
    ]);

    const memberListOpen =
        memberList?.isOpen ??
        (window.innerWidth >= 768
            ? showDesktopMemberList
            : showMobileMemberList);

    const handleBackClick = (): void => {
        if (selectedFriendId) {
            dispatch(setSelectedFriendId(null));
            void navigate('/chat/@me');
        } else if (selectedChannelId) {
            dispatch(setSelectedChannelId(null));
            void navigate(`/chat/@server/${String(selectedServerId)}`);
        }
    };

    return (
        <Box
            as="header"
            className={cn(
                'pointer-events-none relative z-50 flex shrink-0 px-4',
                !headerContour &&
                    !isViewingOlderMessages &&
                    'border-b border-white/5',
                showSecondary ? 'items-start' : 'items-center',
            )}
            ref={headerRef}
        >
            <Box
                aria-hidden="true"
                className="pride-glass-strong pointer-events-none absolute inset-0 z-0 bg-(--bg-chat-header) backdrop-blur-sm"
                style={
                    headerContour
                        ? { clipPath: headerContour.clipPath }
                        : undefined
                }
            />
            <AnimatePresence>
                {isSearchOpen && headerContour ? (
                    <m.div
                        animate={{
                            width: Math.min(
                                CHAT_SEARCH_SIDEBAR_WIDTH,
                                headerContour.width,
                            ),
                        }}
                        aria-hidden="true"
                        className="pride-glass-strong pointer-events-none absolute right-0 bottom-0 z-0 overflow-hidden rounded-tl-xl bg-(--bg-chat-header) backdrop-blur-sm"
                        exit={{ width: 0 }}
                        initial={{ width: 0 }}
                        key="search-header-extension"
                        style={{
                            height:
                                headerContour.height - headerContour.lowerEdge,
                        }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    />
                ) : null}
            </AnimatePresence>
            {/* Left: icon + name + description */}
            <Box
                className={cn(
                    'relative z-10 flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden py-3',
                    showSecondary ? 'items-start' : 'justify-center',
                )}
            >
                <Box className="flex min-w-0 items-center gap-2">
                    <Box className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground">
                        {selectedFriendId ? (
                            <UserProfilePicture
                                noIndicator
                                className="h-5 w-5"
                                size="xs"
                                src={friendUser?.profilePicture}
                                username={friendUser?.username ?? 'User'}
                            />
                        ) : (
                            (() => {
                                const CustomIcon = selectedChannel?.icon
                                    ? ICON_MAP[selectedChannel.icon]
                                    : null;
                                const Icon =
                                    CustomIcon ??
                                    (selectedChannel?.type === 'voice'
                                        ? Volume2
                                        : Hash);
                                return <Icon className="h-5 w-5" />;
                            })()
                        )}
                    </Box>
                    <Box
                        className="min-w-0 flex-1 truncate text-[15px] leading-5 font-semibold text-foreground"
                        ref={channelNameRef}
                    >
                        {selectedFriendId
                            ? (resolveDisplayName(
                                  localNickname,
                                  friendUser?.displayName,
                                  friendUser?.username,
                              ) ?? '...')
                            : (selectedChannel?.name ?? 'No Channel')}
                    </Box>
                </Box>
                {hasDescription ? (
                    <Box className="flex min-w-0 items-start">
                        <svg
                            aria-hidden="true"
                            className="pointer-events-none -mt-0.5 ml-[9px] h-4 w-[19px] shrink-0 self-start overflow-visible"
                            fill="none"
                            viewBox="0 0 19 16"
                        >
                            <path
                                d="M1 0v4c0 3.314 2.686 6 6 6h12"
                                stroke="var(--border-subtle)"
                                strokeLinecap="round"
                                strokeWidth="2"
                            />
                        </svg>
                        <m.button
                            className="pointer-events-auto min-w-0 flex-1 text-left focus:outline-none"
                            type="button"
                            onClick={(): void => {
                                setDescExpanded((v): boolean => !v);
                            }}
                        >
                            <m.div
                                animate={
                                    descExpanded ? 'expanded' : 'collapsed'
                                }
                                className="overflow-hidden"
                                initial={false}
                                transition={{
                                    duration: 0.2,
                                    ease: 'easeInOut',
                                }}
                                variants={{
                                    collapsed: { height: '1.25rem' },
                                    expanded: { height: 'auto' },
                                }}
                            >
                                <Text
                                    className={`block text-xs break-words text-muted-foreground ${
                                        descExpanded
                                            ? 'pb-0.5 whitespace-pre-wrap'
                                            : 'truncate'
                                    }`}
                                    ref={descriptionRef}
                                >
                                    {selectedChannel.description}
                                </Text>
                            </m.div>
                        </m.button>
                    </Box>
                ) : null}
                {hasStatus ? (
                    <Box className="flex min-w-0 items-center">
                        <svg
                            aria-hidden="true"
                            className="-mt-0.5 ml-[9px] h-4 w-[19px] shrink-0 self-start overflow-visible"
                            fill="none"
                            viewBox="0 0 19 16"
                        >
                            <path
                                d="M1 0v4c0 3.314 2.686 6 6 6h12"
                                stroke="var(--border-subtle)"
                                strokeLinecap="round"
                                strokeWidth="2"
                            />
                        </svg>
                        <Text className="truncate text-xs text-muted-foreground">
                            {friendUser?.customStatus?.text}
                        </Text>
                    </Box>
                ) : null}
            </Box>

            {/* Icons Area */}
            <Box
                className={cn(
                    'pointer-events-auto relative z-10 ml-2 flex shrink-0 items-center gap-1',
                    showSecondary && 'pt-2',
                )}
                ref={actionsRef}
            >
                {actions}
                {(selectedChannel || selectedFriendId) && onToggleSearch ? (
                    <Pressable
                        aria-label={
                            isSearchOpen ? 'Close search' : 'Search messages'
                        }
                        className={cn(
                            'p-2 transition-colors',
                            isSearchOpen
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                        onClick={onToggleSearch}
                    >
                        <Search className="h-5 w-5" />
                    </Pressable>
                ) : null}
                {selectedChannel && !selectedFriendId ? (
                    <>
                        <Pressable
                            aria-label="Pinned Messages"
                            className={cn(
                                'relative p-2 transition-colors',
                                showPins
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                            ref={pinButtonRef}
                            onClick={onTogglePins}
                        >
                            <Pin className="h-5 w-5" />
                            {hasUnreadPins ? (
                                <Box className="absolute right-1.5 bottom-1.5 h-2 w-2 rounded-full border border-[var(--bg-chat-header)] bg-red-500" />
                            ) : null}
                        </Pressable>

                        <AnimatePresence>
                            {showPins &&
                            selectedServerId &&
                            selectedChannelId &&
                            onTogglePins != null ? (
                                <PinsDrawer
                                    anchorRef={pinButtonRef}
                                    channelId={selectedChannelId}
                                    serverId={selectedServerId}
                                    onClose={onTogglePins}
                                />
                            ) : null}
                        </AnimatePresence>
                    </>
                ) : null}
                {!memberList?.hideButton &&
                (selectedChannel || selectedFriendId) ? (
                    <Pressable
                        aria-label="Toggle member list"
                        className={cn(
                            'p-2 transition-colors',
                            memberListOpen
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                        onClick={
                            memberList?.onToggle ??
                            ((): void => {
                                if (window.innerWidth >= 768) {
                                    dispatch(toggleDesktopMemberList());
                                } else {
                                    dispatch(toggleMobileMemberList());
                                }
                            })
                        }
                    >
                        <Users className="h-5 w-5" />
                    </Pressable>
                ) : null}
                <Pressable
                    aria-label="Back to contacts"
                    className="p-2 text-muted-foreground transition-colors hover:text-foreground md:hidden"
                    onClick={handleBackClick}
                >
                    <X className="h-6 w-6" />
                </Pressable>
            </Box>
            {headerContour ? (
                <svg
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-20 h-full w-full"
                    preserveAspectRatio="none"
                    viewBox={`0 0 ${headerContour.width} ${headerContour.height}`}
                >
                    <path
                        d={headerContour.borderPath}
                        fill="none"
                        stroke="var(--pride-glass-border, rgba(255, 255, 255, 0.05))"
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>
            ) : null}
        </Box>
    );
};
