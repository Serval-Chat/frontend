import React from 'react';

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
            className="h-12 flex items-center px-4 border-b border-white/5 bg-[var(--bg-chat-header)] backdrop-blur-sm shrink-0"
        >
            <Box className="flex items-center gap-2 overflow-hidden">
                <Box className="text-foreground-muted shrink-0">
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
                <Box className="flex flex-col gap-0.5 min-w-0">
                    <Box className="text-[15px] font-semibold text-foreground truncate">
                        {selectedFriendId
                            ? friendUser?.displayName ||
                              friendUser?.username ||
                              '...'
                            : selectedChannel?.name || 'No Channel'}
                    </Box>
                    {!selectedFriendId && selectedChannel?.description && (
                        <Text className="text-xs text-foreground-muted truncate">
                            {selectedChannel.description}
                        </Text>
                    )}
                </Box>
            </Box>

            {/* Mobile back button + member list toggle */}
            <Box className="ml-auto md:hidden flex items-center gap-1">
                {/* Only show member list icon for server channels, not DMs */}
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
