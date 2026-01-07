import React from 'react';

import { useFriends } from '@/api/friends/friends.queries';
import { UserItem } from '@/ui/components/common/UserItem';

export const FriendList: React.FC = () => {
    const { data: friends, isLoading } = useFriends();

    return (
        <div className="flex flex-col gap-1 p-2">
            {isLoading ? (
                <div className="p-4 flex flex-col gap-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex gap-3 items-center">
                            <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
                            <div className="h-4 w-24 bg-white/5 animate-pulse rounded" />
                        </div>
                    ))}
                </div>
            ) : (
                friends?.map((friend) => (
                    <UserItem
                        key={friend._id}
                        userId={friend._id}
                        initialData={friend}
                    />
                ))
            )}
        </div>
    );
};
