import React, { useState } from 'react';

import { motion } from 'framer-motion';
import { Hash, Users, Volume2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type { Channel } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { useAppDispatch } from '@/store/hooks';
import { useAppSelector } from '@/store/hooks';
import {
    setSelectedChannelId,
    setSelectedFriendId,
    toggleMobileMemberList,
} from '@/store/slices/navSlice';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { ICON_MAP } from '@/ui/utils/iconMap';

interface ChatHeaderProps {
    selectedFriendId: string | null;
    friendUser?: User;
    selectedChannel?: Channel;
}

/**
 * @description Header for the main chat area, displaying the current conversation info.
 */
export const ChatHeader: React.FC<ChatHeaderProps> = ({
    selectedFriendId,
    friendUser,
    selectedChannel,
}) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { selectedServerId, selectedChannelId, showMobileMemberList } =
        useAppSelector((state) => state.nav);

    const [descExpanded, setDescExpanded] = useState(false);

    const hasDescription = !selectedFriendId && !!selectedChannel?.description;

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
            className="flex shrink-0 items-start border-b border-white/5 bg-[var(--bg-chat-header)] px-4 backdrop-blur-sm"
        >
            {/* Left: icon + name + description */}
            <Box className="flex min-w-0 flex-1 items-start gap-2 overflow-hidden py-3">
                <Box className="text-foreground-muted mt-0.5 shrink-0">
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
                </Box>
            </Box>

            {/* Mobile back button + member list toggle */}
            <Box className="ml-2 flex shrink-0 items-center gap-1 pt-2 md:hidden">
                {selectedChannelId && !selectedFriendId && (
                    <button
                        aria-label="Toggle member list"
                        className={`p-2 transition-colors ${
                            showMobileMemberList
                                ? 'text-foreground'
                                : 'text-foreground-muted hover:text-foreground'
                        }`}
                        onClick={() => dispatch(toggleMobileMemberList())}
                    >
                        <Users className="h-5 w-5" />
                    </button>
                )}
                <button
                    aria-label="Back to contacts"
                    className="text-foreground-muted -mr-2 p-2 transition-colors hover:text-foreground"
                    onClick={handleBackClick}
                >
                    <X className="h-6 w-6" />
                </button>
            </Box>
        </Box>
    );
};
