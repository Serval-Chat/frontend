import React from 'react';

import { useAppSelector } from '@/store/hooks';
import { MainChat } from '@/ui/components/chat/MainChat';
import { FriendRequestList } from '@/ui/components/friends/FriendRequestList';
import { cn } from '@/utils/cn';

/**
 * @description Main chat area content component.
 */
export const MainContent: React.FC = () => {
    const { selectedFriendId, selectedChannelId } = useAppSelector(
        (state) => state.nav
    );

    const isNothingSelected = !selectedFriendId && !selectedChannelId;

    return (
        <main
            className={cn(
                'flex-1 flex flex-col relative z-content overflow-hidden'
            )}
        >
            {isNothingSelected ? <FriendRequestList /> : <MainChat />}
        </main>
    );
};
