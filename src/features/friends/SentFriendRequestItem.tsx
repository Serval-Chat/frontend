import { X } from 'lucide-react';

import { useCancelFriendRequest } from '@/api/friends/friends.queries';
import { useUserById } from '@/api/users/users.queries';
import { UserProfilePicture } from '@/features/users/UserProfilePicture';
import { Box } from '@/ui/primitives/Box';
import { Button } from '@/ui/primitives/Button';
import { MutedText } from '@/ui/primitives/MutedText';
import { Text } from '@/ui/primitives/Text';

interface SentFriendRequestItemProps {
    requestId: string;
    toId: string;
    toUsername: string;
}

export const SentFriendRequestItem = ({
    requestId,
    toId,
    toUsername,
}: SentFriendRequestItemProps) => {
    const { data: userProfile } = useUserById(toId);
    const { mutate: cancel, isPending: isCancelling } =
        useCancelFriendRequest();

    return (
        <Box className="group flex items-center justify-between rounded-lg bg-bg-subtle p-3 transition-colors hover:bg-bg-secondary">
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
                    aria-label="Cancel friend request"
                    className="h-8 w-8 rounded-full border-transparent p-0 text-red-500 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-600"
                    loading={isCancelling}
                    variant="normal"
                    onClick={(): void => {
                        cancel(requestId);
                    }}
                >
                    <X className="h-4 w-4" />
                </Button>
            </Box>
        </Box>
    );
};
