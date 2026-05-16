import React from 'react';

import { X } from 'lucide-react';

import { useCancelFriendRequest } from '@/api/friends/friends.queries';
import { useUserById } from '@/api/users/users.queries';
import { Button } from '@/ui/components/common/Button';
import { MutedText } from '@/ui/components/common/MutedText';
import { Text } from '@/ui/components/common/Text';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';

interface SentFriendRequestItemProps {
    requestId: string;
    toId: string;
    toUsername: string;
}

export const SentFriendRequestItem: React.FC<SentFriendRequestItemProps> = ({
    requestId,
    toId,
    toUsername,
}) => {
    const { data: userProfile } = useUserById(toId);
    const { mutate: cancel, isPending: isCancelling } =
        useCancelFriendRequest();

    return (
        <Box className="group hover:bg-bg-tertiary flex items-center justify-between rounded-lg bg-bg-subtle p-3 transition-colors">
            <Box className="flex items-center gap-3">
                <UserProfilePicture
                    size="md"
                    src={userProfile?.profilePicture}
                    username={userProfile?.displayName || toUsername}
                />
                <Box className="flex flex-col">
                    <Text weight="medium">
                        {userProfile?.displayName || toUsername}
                    </Text>
                    <MutedText className="text-xs">
                        Outgoing Friend Request
                    </MutedText>
                </Box>
            </Box>
            <Box className="flex items-center gap-2">
                <Button
                    className="h-8 w-8 rounded-full border-transparent p-0 text-red-500 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-600"
                    loading={isCancelling}
                    variant="normal"
                    onClick={() => cancel(requestId)}
                >
                    <X className="h-4 w-4" />
                </Button>
            </Box>
        </Box>
    );
};
