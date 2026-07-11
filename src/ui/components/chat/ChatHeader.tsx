import React, { useEffect, useRef, useState } from 'react';

import { AnimatePresence, m } from 'framer-motion';
import { AtSign, Hash, Pin, Search, Users, Volume2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { usePinnedMessages } from '@/api/chat/chat.queries';
import type { ChatMessage } from '@/api/chat/chat.types';
import { useFriends } from '@/api/friends/friends.queries';
import type { Channel } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useAppDispatch, useAppShallowSelector } from '@/store/hooks';
import {
    setSelectedChannelId,
    setSelectedFriendId,
    toggleDesktopMemberList,
    toggleMobileMemberList,
} from '@/store/slices/navSlice';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { ICON_MAP } from '@/ui/utils/iconMap';
import { cn } from '@/utils/cn';
import { resolveDisplayName } from '@/utils/displayName';

import { PinsDrawer } from './PinsDrawer';

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

    const { data: me } = useMe();
    const { data: friends } = useFriends();
    const localNickname = friends?.find(
        (f): boolean => f.id === selectedFriendId,
    )?.nickname;
    const { data: pins } = usePinnedMessages(
        selectedServerId,
        selectedChannelId,
    );
    const [lastViewedAt, setLastViewedAt] = useState<number>(0);

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
                'pride-glass-strong z-50 flex shrink-0 border-b border-white/5 bg-(--bg-chat-header) px-4 backdrop-blur-sm',
                showSecondary ? 'items-start' : 'items-center',
            )}
        >
            {/* Left: icon + name + description */}
            <Box
                className={cn(
                    'flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden py-3',
                    showSecondary ? 'items-start' : 'justify-center',
                )}
            >
                <Box className="flex min-w-0 items-center gap-2">
                    <Box className="text-foreground-muted flex h-5 w-5 shrink-0 items-center justify-center">
                        {selectedFriendId ? (
                            <AtSign className="h-5 w-5" />
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
                    <Box className="min-w-0 flex-1 truncate text-[15px] leading-5 font-semibold text-foreground">
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
                    <m.button
                        className="w-full text-left focus:outline-none"
                        type="button"
                        onClick={(): void => {
                            setDescExpanded((v): boolean => !v);
                        }}
                    >
                        <m.div
                            animate={descExpanded ? 'expanded' : 'collapsed'}
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
                            <span
                                className={`text-foreground-muted block text-xs break-words ${
                                    descExpanded
                                        ? 'pb-0.5 whitespace-pre-wrap'
                                        : 'truncate'
                                }`}
                            >
                                {selectedChannel.description}
                            </span>
                        </m.div>
                    </m.button>
                ) : null}
                {hasStatus ? (
                    <Text className="text-foreground-muted truncate text-xs">
                        {friendUser?.customStatus?.text}
                    </Text>
                ) : null}
            </Box>

            {/* Icons Area */}
            <Box
                className={cn(
                    'ml-2 flex shrink-0 items-center gap-1',
                    showSecondary && 'pt-2',
                )}
            >
                {actions}
                {(selectedChannel || selectedFriendId) && onToggleSearch ? (
                    <button
                        aria-label={
                            isSearchOpen ? 'Close search' : 'Search messages'
                        }
                        className={cn(
                            'p-2 transition-colors',
                            isSearchOpen
                                ? 'text-primary'
                                : 'text-foreground-muted hover:text-foreground',
                        )}
                        type="button"
                        onClick={onToggleSearch}
                    >
                        <Search className="h-5 w-5" />
                    </button>
                ) : null}
                {selectedChannel && !selectedFriendId ? (
                    <>
                        <button
                            aria-label="Pinned Messages"
                            className={cn(
                                'relative p-2 transition-colors',
                                showPins
                                    ? 'text-primary'
                                    : 'text-foreground-muted hover:text-foreground',
                            )}
                            ref={pinButtonRef}
                            type="button"
                            onClick={onTogglePins}
                        >
                            <Pin className="h-5 w-5" />
                            {hasUnreadPins ? (
                                <Box className="absolute right-1.5 bottom-1.5 h-2 w-2 rounded-full border border-[var(--bg-chat-header)] bg-red-500" />
                            ) : null}
                        </button>

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
                    <button
                        aria-label="Toggle member list"
                        className={cn(
                            'p-2 transition-colors',
                            memberListOpen
                                ? 'text-foreground'
                                : 'text-foreground-muted hover:text-foreground',
                        )}
                        type="button"
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
                    </button>
                ) : null}
                <button
                    aria-label="Back to contacts"
                    className="text-foreground-muted p-2 transition-colors hover:text-foreground md:hidden"
                    type="button"
                    onClick={handleBackClick}
                >
                    <X className="h-6 w-6" />
                </button>
            </Box>
        </Box>
    );
};
