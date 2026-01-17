import React from 'react';

import { Box } from '@/ui/components/layout/Box';

import { AddFriendForm } from './AddFriendForm';
import { FriendList } from './FriendList';

const FriendsHeader = (): React.ReactNode => (
    <Box className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-3 px-1">
        Friends
    </Box>
);

export const FriendsSection: React.FC = () => (
    <Box className="flex flex-col h-full overflow-hidden">
        <Box className="px-3 pt-4 pb-2 shrink-0">
            <FriendsHeader />
            <AddFriendForm />
        </Box>
        <Box className="flex-1 overflow-y-auto custom-scrollbar">
            <FriendList />
        </Box>
    </Box>
);
