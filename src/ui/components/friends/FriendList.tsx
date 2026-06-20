import { useNavigate } from 'react-router-dom';

import { useFriends } from '@/api/friends/friends.queries';
import { useAppSelector } from '@/store/hooks';
import { Skeleton } from '@/ui/components/common/Skeleton';
import { UserItem } from '@/ui/components/common/UserItem';
import { Box } from '@/ui/components/layout/Box';

export const FriendList = () => {
    const { data: friends, isLoading } = useFriends();
    const selectedFriendId = useAppSelector(
        (state): string | null => state.nav.selectedFriendId,
    );
    const unreadDms = useAppSelector(
        (state): Record<string, number> => state.unread.unreadDms,
    );

    const navigate = useNavigate();

    const handleFriendClick = (friendId: string): void => {
        void navigate(`/chat/@user/${friendId}`);
    };

    const sortedFriends = friends?.slice().sort((a, b): 1 | -1 | 0 => {
        const aPinned = a.isPinned ?? false;
        const bPinned = b.isPinned ?? false;

        if (aPinned && !bPinned) return -1;
        if (bPinned && !aPinned) return 1;

        const aUnread = unreadDms[a.id] || 0;
        const bUnread = unreadDms[b.id] || 0;

        if (aUnread > 0 && bUnread === 0) return -1;
        if (bUnread > 0 && aUnread === 0) return 1;

        return 0;
    });

    return (
        <Box className="flex flex-col gap-1 p-2">
            {isLoading ? (
                <Box className="flex flex-col gap-3 p-4">
                    {[1, 2, 3, 4, 5].map((id) => (
                        <Box
                            className="flex items-center gap-3"
                            key={`friend-skeleton-${id}`}
                        >
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
                sortedFriends?.map((friend) => (
                    <UserItem
                        initialData={friend}
                        isActive={selectedFriendId === String(friend.id)}
                        key={String(friend.id)}
                        userId={String(friend.id)}
                        onClick={(): void =>
                            handleFriendClick(String(friend.id))
                        }
                    />
                ))
            )}
        </Box>
    );
};
