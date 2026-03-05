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
            className="flex items-start px-4 border-b border-white/5 bg-[var(--bg-chat-header)] backdrop-blur-sm shrink-0"
        >
            {/* Left: icon + name + description */}
            <Box className="flex items-start gap-2 flex-1 min-w-0 overflow-hidden py-3">
                <Box className="text-foreground-muted shrink-0 mt-0.5">
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
                            return <Icon className="w-5 h-5" />;
                        })()
                    )}
                </Box>
                <Box className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <Box className="text-[15px] font-semibold text-foreground truncate leading-5">
                        {selectedFriendId
                            ? friendUser?.displayName ||
                              friendUser?.username ||
                              '...'
                            : selectedChannel?.name || 'No Channel'}
                    </Box>
                    {hasDescription && (
                        <motion.button
                            className="text-left w-full focus:outline-none"
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
                                    className={`text-xs text-foreground-muted block break-words ${
                                        descExpanded
                                            ? 'whitespace-pre-wrap pb-0.5'
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
            <Box className="ml-2 md:hidden flex items-center gap-1 pt-2 shrink-0">
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
                        <Users className="w-5 h-5" />
                    </button>
                )}
                <button
                    aria-label="Back to contacts"
                    className="p-2 -mr-2 text-foreground-muted hover:text-foreground transition-colors"
                    onClick={handleBackClick}
                >
                    <X className="w-6 h-6" />
                </button>
            </Box>
        </Box>
    );
};
