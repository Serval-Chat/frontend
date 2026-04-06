import React, { useEffect, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Hash, Pin, Users, Volume2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { usePinnedMessages } from '@/api/chat/chat.queries';
import type { ChatMessage } from '@/api/chat/chat.types';
import type { Channel } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    setSelectedChannelId,
    setSelectedFriendId,
    toggleMobileMemberList,
} from '@/store/slices/navSlice';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { ICON_MAP } from '@/ui/utils/iconMap';
import { cn } from '@/utils/cn';

import { PinsDrawer } from './PinsDrawer';

interface ChatHeaderProps {
    selectedFriendId: string | null;
    friendUser?: User;
    selectedChannel?: Channel;
    onTogglePins?: () => void;
    showPins?: boolean;
}

/**
 * @description Header for the main chat area, displaying the current conversation info.
 */
export const ChatHeader: React.FC<ChatHeaderProps> = ({
    selectedFriendId,
    friendUser,
    selectedChannel,
    onTogglePins,
    showPins,
}) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { selectedServerId, selectedChannelId, showMobileMemberList } =
        useAppSelector((state) => state.nav);

    const [descExpanded, setDescExpanded] = useState(false);
    const pinButtonRef = useRef<HTMLButtonElement>(null);

    const { data: me } = useMe();
    const { data: pins } = usePinnedMessages(
        selectedServerId,
        selectedChannelId,
    );
    const [lastViewedAt, setLastViewedAt] = useState<number>(0);

    // Sync lastViewedAt from localStorage
    useEffect(() => {
        if (!me?._id || !selectedChannelId) return;

        const key = `serchat_pins_last_viewed_${me._id}_${selectedChannelId}`;
        const update = (): void => {
            const saved = localStorage.getItem(key);
            setLastViewedAt(saved ? parseInt(saved, 10) : 0);
        };

        update();
        window.addEventListener('storage', update);
        return () => window.removeEventListener('storage', update);
    }, [me?._id, selectedChannelId]);

    const hasUnreadPins = React.useMemo(() => {
        if (!pins || pins.length === 0 || showPins) return false;
        return pins.some(
            (p: ChatMessage) => new Date(p.createdAt).getTime() > lastViewedAt,
        );
    }, [pins, lastViewedAt, showPins]);

    const hasDescription = !selectedFriendId && !!selectedChannel?.description;
    const hasStatus = !!selectedFriendId && !!friendUser?.customStatus?.text;
    const showSecondary = hasDescription || hasStatus;

    const handleBackClick = (): void => {
        if (selectedFriendId) {
            dispatch(setSelectedFriendId(null));
            void navigate('/chat/@me');
        } else if (selectedChannelId) {
            dispatch(setSelectedChannelId(null));
            void navigate(`/chat/@server/${selectedServerId}`);
        }
    };

    return (
        <Box
            as="header"
            className="z-50 flex shrink-0 items-start border-b border-white/5 bg-[var(--bg-chat-header)] px-4 backdrop-blur-sm"
        >
            {/* Left: icon + name + description */}
            <Box
                className={cn(
                    'flex min-w-0 flex-1 gap-2 overflow-hidden py-3',
                    showSecondary ? 'items-start' : 'items-center',
                )}
            >
                <Box
                    className={cn(
                        'text-foreground-muted shrink-0',
                        showSecondary && 'mt-0.5',
                    )}
                >
                    {selectedFriendId ? (
                        <Text className="text-xl">@</Text>
                    ) : (
                        (() => {
                            const CustomIcon = selectedChannel?.icon
                                ? ICON_MAP[selectedChannel.icon]
                                : null;
                            const Icon =
                                CustomIcon ||
                                (selectedChannel?.type === 'voice'
                                    ? Volume2
                                    : Hash);
                            return <Icon className="h-5 w-5" />;
                        })()
                    )}
                </Box>
                <Box className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <Box className="truncate text-[15px] leading-5 font-semibold text-foreground">
                        {selectedFriendId
                            ? friendUser?.displayName ||
                              friendUser?.username ||
                              '...'
                            : selectedChannel?.name || 'No Channel'}
                    </Box>
                    {hasDescription && (
                        <motion.button
                            className="w-full text-left focus:outline-none"
                            type="button"
                            onClick={() => setDescExpanded((v) => !v)}
                        >
                            <motion.div
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
                                <span
                                    className={`text-foreground-muted block text-xs break-words ${
                                        descExpanded
                                            ? 'pb-0.5 whitespace-pre-wrap'
                                            : 'truncate'
                                    }`}
                                >
                                    {selectedChannel!.description}
                                </span>
                            </motion.div>
                        </motion.button>
                    )}
                    {hasStatus && (
                        <Text className="text-foreground-muted truncate text-xs">
                            {friendUser?.customStatus?.text}
                        </Text>
                    )}
                </Box>
            </Box>

            {/* Icons Area */}
            <Box className="ml-2 flex shrink-0 items-center gap-1 pt-2">
                {selectedChannel && !selectedFriendId && (
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
                            onClick={onTogglePins}
                        >
                            <Pin className="h-5 w-5" />
                            {hasUnreadPins && (
                                <Box className="absolute right-1.5 bottom-1.5 h-2 w-2 rounded-full border border-[var(--bg-chat-header)] bg-red-500" />
                            )}
                        </button>

                        <AnimatePresence>
                            {showPins &&
                                selectedServerId &&
                                selectedChannelId && (
                                    <PinsDrawer
                                        anchorRef={pinButtonRef}
                                        channelId={selectedChannelId}
                                        serverId={selectedServerId}
                                        onClose={onTogglePins!}
                                    />
                                )}
                        </AnimatePresence>

                        <button
                            aria-label="Toggle member list"
                            className={cn(
                                'p-2 transition-colors md:hidden',
                                showMobileMemberList
                                    ? 'text-foreground'
                                    : 'text-foreground-muted hover:text-foreground',
                            )}
                            onClick={() => dispatch(toggleMobileMemberList())}
                        >
                            <Users className="h-5 w-5" />
                        </button>
                    </>
                )}
                <button
                    aria-label="Back to contacts"
                    className="text-foreground-muted p-2 transition-colors hover:text-foreground md:hidden"
                    onClick={handleBackClick}
                >
                    <X className="h-6 w-6" />
                </button>
            </Box>
        </Box>
    );
};
