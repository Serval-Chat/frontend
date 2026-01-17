import React from 'react';

import { Check, X } from 'lucide-react';

import {
    useAcceptFriendRequest,
    useRejectFriendRequest,
} from '@/api/friends/friends.queries';
import { useUserById } from '@/api/users/users.queries';
import { Button } from '@/ui/components/common/Button';
import { MutedText } from '@/ui/components/common/MutedText';
import { Text } from '@/ui/components/common/Text';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';

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
        <Box className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-tertiary)] transition-colors group">
            <Box className="flex items-center gap-3">
                <UserProfilePicture
                    size="md"
                    src={userProfile?.profilePicture}
                    username={userProfile?.displayName || fromUsername}
                />
                <Box className="flex flex-col">
                    <Text weight="medium">
                        {userProfile?.displayName || fromUsername}
                    </Text>
                    <MutedText className="text-xs">
                        Incoming Friend Request
                    </MutedText>
                </Box>
            </Box>
            <Box className="flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <Button
                    className="h-8 w-8 p-0 rounded-full text-green-500 hover:text-green-600 hover:bg-green-500/10 border-transparent hover:border-green-500/50"
                    disabled={isRejecting}
                    loading={isAccepting}
                    variant="normal"
                    onClick={() => accept(requestId)}
                >
                    <Check className="h-4 w-4" />
                </Button>
                <Button
                    className="h-8 w-8 p-0 rounded-full text-red-500 hover:text-red-600 hover:bg-red-500/10 border-transparent hover:border-red-500/50"
                    disabled={isAccepting}
                    loading={isRejecting}
                    variant="normal"
                    onClick={() => reject(requestId)}
                >
                    <X className="h-4 w-4" />
                </Button>
            </Box>
        </Box>
    );
};
