import React from 'react';

import { Check, X } from 'lucide-react';

import {
    useAcceptFriendRequest,
    useRejectFriendRequest,
} from '@/api/friends/friends.queries';
import { useUserById } from '@/api/users/users.queries';
import { Button } from '@/ui/components/common/Button';
import { MutedText } from '@/ui/components/common/MutedText';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';

interface FriendRequestItemProps {
    requestId: string;
    fromId: string;
    fromUsername: string;
}

export const FriendRequestItem: React.FC<FriendRequestItemProps> = ({
    requestId,
    fromId,
    fromUsername,
}) => {
    const { data: userProfile } = useUserById(fromId);
    const { mutate: accept, isPending: isAccepting } = useAcceptFriendRequest();
    const { mutate: reject, isPending: isRejecting } = useRejectFriendRequest();

    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-tertiary)] transition-colors group">
            <div className="flex items-center gap-3">
                <UserProfilePicture
                    src={userProfile?.profilePicture}
                    username={userProfile?.displayName || fromUsername}
                    size="md"
                />
                <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                        {userProfile?.displayName || fromUsername}
                    </span>
                    <MutedText className="text-xs">
                        Incoming Friend Request
                    </MutedText>
                </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <Button
                    variant="normal"
                    className="h-8 w-8 p-0 rounded-full text-green-500 hover:text-green-600 hover:bg-green-500/10 border-transparent hover:border-green-500/50"
                    onClick={() => accept(requestId)}
                    loading={isAccepting}
                    disabled={isRejecting}
                >
                    <Check className="h-4 w-4" />
                </Button>
                <Button
                    variant="normal"
                    className="h-8 w-8 p-0 rounded-full text-red-500 hover:text-red-600 hover:bg-red-500/10 border-transparent hover:border-red-500/50"
                    onClick={() => reject(requestId)}
                    loading={isRejecting}
                    disabled={isAccepting}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};
