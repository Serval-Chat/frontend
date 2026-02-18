import React from 'react';

import { Hash, Volume2 } from 'lucide-react';

import type { Channel } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
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
}) => (
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
    </Box>
);
