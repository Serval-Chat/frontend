import React from 'react';

import { useAppSelector } from '@/store/hooks';
import { MainChat } from '@/ui/components/chat/MainChat';
import { FriendRequestList } from '@/ui/components/friends/FriendRequestList';
import { cn } from '@/utils/cn';

/**
 * @description Main chat area content component.
 */
export const MainContent: React.FC = () => {
    const {
        selectedFriendId,
        selectedServerId,
        selectedChannelId,
        navMode,
        mobileHomeTab,
    } = useAppSelector((state) => state.nav);

    const isNothingSelected = !selectedFriendId && !selectedChannelId;

    const conversationKey = selectedFriendId
        ? `dm-${selectedFriendId}`
        : selectedServerId && selectedChannelId
          ? `channel-${selectedServerId}-${selectedChannelId}`
          : 'none';

    return (
        <main
            className={cn(
                'flex-1 flex flex-col relative z-content overflow-hidden',
                'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
                navMode === 'friends' &&
                    isNothingSelected &&
                    mobileHomeTab === 'friends' &&
                    'max-md:hidden',
                navMode === 'servers' && isNothingSelected && 'max-md:hidden',
            )}
        >
            {isNothingSelected ? (
                <FriendRequestList />
            ) : (
                <MainChat key={conversationKey} />
            )}
        </main>
    );
};
