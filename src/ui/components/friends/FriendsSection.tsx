import React from 'react';

import { AddFriendForm } from './AddFriendForm';
import { FriendList } from './FriendList';

const FriendsHeader = () => (
    <div className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-3 px-1">
        Friends
    </div>
);

export const FriendsSection: React.FC = () => {
    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="px-3 pt-4 pb-2 shrink-0">
                <FriendsHeader />
                <AddFriendForm />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <FriendList />
            </div>
        </div>
    );
};
