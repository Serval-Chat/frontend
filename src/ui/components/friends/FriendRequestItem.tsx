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
        <Box className="group hover:bg-bg-tertiary flex items-center justify-between rounded-lg bg-bg-subtle p-3 transition-colors">
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
            <Box className="flex items-center gap-2 transition-opacity">
                <Button
                    className="h-8 w-8 rounded-full border-transparent p-0 text-green-500 hover:border-green-500/50 hover:bg-green-500/10 hover:text-green-600"
                    disabled={isRejecting}
                    loading={isAccepting}
                    variant="normal"
                    onClick={() => accept(requestId)}
                >
                    <Check className="h-4 w-4" />
                </Button>
                <Button
                    className="h-8 w-8 rounded-full border-transparent p-0 text-red-500 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-600"
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
