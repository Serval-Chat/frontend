import React from 'react';

import { useNavigate } from 'react-router-dom';

import { useIncomingRequests } from '@/api/friends/friends.queries';
import { useAppSelector } from '@/store/hooks';
import { Divider } from '@/ui/components/common/Divider';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

import { FriendList } from './FriendList';

const FriendsHeader = (): React.ReactNode => (
    <Box className="text-foreground-muted mb-3 px-1 text-xs font-semibold tracking-wider uppercase">
        Friends
    </Box>
);

const FriendRequestNavItem = (): React.ReactNode => {
    const navigate = useNavigate();
    const { data: requests } = useIncomingRequests();
    const selectedFriendId = useAppSelector(
        (state): string | null => state.nav.selectedFriendId,
    );
    const selectedChannelId = useAppSelector(
        (state): string | null => state.nav.selectedChannelId,
    );

    const isActive = !selectedFriendId && !selectedChannelId;

    return (
        <button
            className={cn(
                'group mb-4 flex w-full items-center gap-3 rounded-md px-2 py-1.5 transition-all duration-200',
                isActive
                    ? 'bg-bg-tertiary text-foreground'
                    : 'text-foreground-muted hover:bg-bg-subtle hover:text-foreground',
            )}
            onClick={(): void => {
                void navigate('/chat/@me');
            }}
        >
            <Text className="flex-1 text-left font-medium" size="sm">
                Friends
            </Text>
            {requests && requests.length > 0 && (
                <Box className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white">
                    {requests.length}
                </Box>
            )}
        </button>
    );
};

export const FriendsSection = () => (
    <Box className="flex h-full flex-col overflow-hidden">
        <Box className="shrink-0 px-3 pt-4 pb-2">
            <FriendsHeader />
            <FriendRequestNavItem />
            <Divider fullWidth className="my-2" />
        </Box>
        <Box className="custom-scrollbar flex-1 overflow-y-auto">
            <FriendList />
        </Box>
    </Box>
);
