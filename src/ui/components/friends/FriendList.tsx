import React from 'react';

import { useNavigate } from 'react-router-dom';

import { useFriends } from '@/api/friends/friends.queries';
import { useAppSelector } from '@/store/hooks';
import { Skeleton } from '@/ui/components/common/Skeleton';
import { UserItem } from '@/ui/components/common/UserItem';
import { Box } from '@/ui/components/layout/Box';

export const FriendList: React.FC = () => {
    const { data: friends, isLoading } = useFriends();
    const selectedFriendId = useAppSelector(
        (state) => state.nav.selectedFriendId,
    );

    const navigate = useNavigate();

    const handleFriendClick = (friendId: string): void => {
        void navigate(`/chat/@user/${friendId}`);
    };

    return (
        <Box className="flex flex-col gap-1 p-2">
            {isLoading ? (
                <Box className="p-4 flex flex-col gap-3">
                    {[...Array(5)].map((_, i) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <Box className="flex gap-3 items-center" key={i}>
                            <Skeleton
                                height={32}
                                variant="circular"
                                width={32}
                            />
                            <Skeleton height={16} variant="text" width={96} />
                        </Box>
                    ))}
                </Box>
            ) : (
                friends?.map((friend) => (
                    <UserItem
                        initialData={friend}
                        isActive={selectedFriendId === String(friend._id)}
                        key={String(friend._id)}
                        userId={String(friend._id)}
                        onClick={() => handleFriendClick(String(friend._id))}
                    />
                ))
            )}
        </Box>
    );
};
