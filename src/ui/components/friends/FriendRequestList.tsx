import React from 'react';

import { CheckCircle } from 'lucide-react';

import { useIncomingRequests } from '@/api/friends/friends.queries';
import { Heading } from '@/ui/components/common/Heading';
import { MutedText } from '@/ui/components/common/MutedText';
import { Skeleton } from '@/ui/components/common/Skeleton';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';

import { FriendRequestItem } from './FriendRequestItem';

export const FriendRequestList: React.FC = () => {
    const { data: requests, isLoading } = useIncomingRequests();

    if (isLoading) {
        return (
            <Box className="flex h-full flex-col overflow-hidden">
                <Box className="space-y-2 border-b border-bg-subtle p-6">
                    <Skeleton height={28} width={180} />
                    <Skeleton height={16} width={140} />
                </Box>
                <Box className="flex-1 space-y-4 p-4">
                    {['skeleton-1', 'skeleton-2', 'skeleton-3'].map((key) => (
                        <Box
                            className="flex items-center justify-between p-3"
                            key={key}
                        >
                            <Box className="flex items-center gap-3">
                                <Skeleton
                                    height={40}
                                    variant="circular"
                                    width={40}
                                />
                                <Box className="space-y-1">
                                    <Skeleton height={16} width={100} />
                                    <Skeleton height={12} width={140} />
                                </Box>
                            </Box>
                            <Box className="flex gap-2">
                                <Skeleton
                                    height={32}
                                    variant="circular"
                                    width={32}
                                />
                                <Skeleton
                                    height={32}
                                    variant="circular"
                                    width={32}
                                />
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>
        );
    }

    if (!requests || requests.length === 0) {
        return (
            <Box className="animate-in fade-in zoom-in flex h-full flex-col items-center justify-center p-8 text-center duration-300">
                <Box className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bg-subtle">
                    <CheckCircle className="text-foreground-muted h-8 w-8 opacity-20" />
                </Box>
                <Heading className="mb-2" level={3}>
                    No pending requests
                </Heading>
                <MutedText>
                    You're all caught up! When you receive friend requests,
                    they'll show up here.
                </MutedText>
            </Box>
        );
    }

    return (
        <Box className="flex h-full flex-col overflow-hidden">
            <Box className="border-b border-bg-subtle p-6">
                <Heading
                    className="flex items-center gap-2 text-xl font-bold"
                    level={2}
                >
                    Friend Requests
                    <Text
                        className="rounded-full bg-primary/20 px-2 py-0.5"
                        size="xs"
                        variant="primary"
                    >
                        {requests.length}
                    </Text>
                </Heading>
                <MutedText>Accept or decline friend requests.</MutedText>
            </Box>

            <Box className="flex-1 space-y-2 overflow-y-auto p-4">
                {requests.map((request) => (
                    <FriendRequestItem
                        fromId={request.fromId || ''}
                        fromUsername={request.from || ''}
                        key={request._id}
                        requestId={request._id}
                    />
                ))}
            </Box>
        </Box>
    );
};
