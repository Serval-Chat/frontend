import React from 'react';

import { Hash, Volume2 } from 'lucide-react';

import type { Channel } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
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
    return (
        <header className="h-12 flex items-center px-4 border-b border-white/5 bg-bg-secondary/50 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-2 overflow-hidden">
                <div className="text-foreground-muted shrink-0">
                    {selectedFriendId ? (
                        <span className="text-xl">@</span>
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
                </div>
                <div className="text-[15px] font-semibold text-foreground truncate">
                    {selectedFriendId
                        ? friendUser?.displayName ||
                          friendUser?.username ||
                          '...'
                        : selectedChannel?.name || 'Channel'}
                </div>
            </div>
        </header>
    );
};
