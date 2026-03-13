import React from 'react';

import { Box } from '@/ui/components/layout/Box';

import { AddFriendForm } from './AddFriendForm';
import { FriendList } from './FriendList';

const FriendsHeader = (): React.ReactNode => (
    <Box className="text-foreground-muted mb-3 px-1 text-xs font-semibold tracking-wider uppercase">
        Friends
    </Box>
);

export const FriendsSection: React.FC = () => (
    <Box className="flex h-full flex-col overflow-hidden">
        <Box className="shrink-0 px-3 pt-4 pb-2">
            <FriendsHeader />
            <AddFriendForm />
        </Box>
        <Box className="custom-scrollbar flex-1 overflow-y-auto">
            <FriendList />
        </Box>
    </Box>
);
