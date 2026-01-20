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
            <Box className="flex flex-col h-full overflow-hidden">
                <Box className="p-6 border-b border-[var(--color-bg-subtle)] space-y-2">
                    <Skeleton height={28} width={180} />
                    <Skeleton height={16} width={140} />
                </Box>
                <Box className="flex-1 p-4 space-y-4">
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
            <Box className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in zoom-in duration-300">
                <Box className="w-16 h-16 mb-4 rounded-full bg-[var(--color-bg-subtle)] flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-foreground-muted opacity-20" />
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
        <Box className="flex flex-col h-full overflow-hidden">
            <Box className="p-6 border-b border-[var(--color-bg-subtle)]">
                <Heading
                    className="text-xl font-bold flex items-center gap-2"
                    level={2}
                >
                    Friend Requests
                    <Text
                        className="bg-primary/20 px-2 py-0.5 rounded-full"
                        size="xs"
                        variant="primary"
                    >
                        {requests.length}
                    </Text>
                </Heading>
                <MutedText>Accept or decline friend requests.</MutedText>
            </Box>

            <Box className="flex-1 overflow-y-auto p-4 space-y-2">
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
