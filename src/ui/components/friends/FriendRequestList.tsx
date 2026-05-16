import React from 'react';

import { CheckCircle } from 'lucide-react';

import {
    useIncomingRequests,
    useOutgoingRequests,
} from '@/api/friends/friends.queries';
import { Heading } from '@/ui/components/common/Heading';
import { MutedText } from '@/ui/components/common/MutedText';
import { Skeleton } from '@/ui/components/common/Skeleton';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

import { AddFriendForm } from './AddFriendForm';
import { BlockedListMain } from './BlockedListMain';
import { FriendListMain } from './FriendListMain';
import { FriendRequestItem } from './FriendRequestItem';
import { SentFriendRequestItem } from './SentFriendRequestItem';

export const FriendRequestList: React.FC = () => {
    const { data: requests, isLoading } = useIncomingRequests();
    const { data: sentRequests } = useOutgoingRequests();
    const [view, setView] = React.useState<
        'all' | 'pending' | 'sent' | 'blocked' | 'add'
    >('pending');

    React.useEffect(() => {
        if (!isLoading && (!requests || requests.length === 0)) {
            setView('all');
        }
    }, [isLoading, requests]);

    if (isLoading) {
        return (
            <Box className="flex h-full flex-col overflow-hidden">
                <Box className="flex h-12 shrink-0 items-center border-b border-bg-subtle px-4">
                    <Skeleton height={20} width={120} />
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

    return (
        <Box className="flex h-full flex-col overflow-hidden">
            <Box className="flex h-12 shrink-0 items-center border-b border-bg-subtle bg-bg-secondary px-4 shadow-sm">
                <Box className="flex flex-1 items-center gap-4">
                    <Heading className="text-sm font-bold" level={2}>
                        Friends
                    </Heading>

                    <Box className="h-6 w-[1px] bg-bg-subtle" />

                    <Box className="flex items-center gap-2">
                        <button
                            className={cn(
                                'rounded px-3 py-1 text-sm font-semibold transition-all duration-200',
                                view === 'all'
                                    ? 'bg-primary text-foreground-inverse hover:bg-primary-hover'
                                    : 'text-foreground-muted hover:bg-bg-tertiary hover:text-foreground',
                            )}
                            onClick={() => setView('all')}
                        >
                            All
                        </button>
                        <button
                            className={cn(
                                'relative rounded px-3 py-1 text-sm font-semibold transition-all duration-200',
                                view === 'pending'
                                    ? 'bg-primary text-foreground-inverse hover:bg-primary-hover'
                                    : 'text-foreground-muted hover:bg-bg-tertiary hover:text-foreground',
                            )}
                            onClick={() => setView('pending')}
                        >
                            Pending
                            {requests && requests.length > 0 && (
                                <Box className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white shadow-sm">
                                    {requests.length}
                                </Box>
                            )}
                        </button>
                        <button
                            className={cn(
                                'relative rounded px-3 py-1 text-sm font-semibold transition-all duration-200',
                                view === 'sent'
                                    ? 'bg-primary text-foreground-inverse hover:bg-primary-hover'
                                    : 'text-foreground-muted hover:bg-bg-tertiary hover:text-foreground',
                            )}
                            onClick={() => setView('sent')}
                        >
                            Sent
                            {sentRequests && sentRequests.length > 0 && (
                                <Box className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full border border-bg-secondary bg-primary px-1 text-[10px] font-bold text-white shadow-sm">
                                    {sentRequests.length}
                                </Box>
                            )}
                        </button>

                        <button
                            className={cn(
                                'rounded px-3 py-1 text-sm font-semibold transition-all duration-200',
                                view === 'blocked'
                                    ? 'bg-primary text-foreground-inverse hover:bg-primary-hover'
                                    : 'text-foreground-muted hover:bg-bg-tertiary hover:text-foreground',
                            )}
                            onClick={() => setView('blocked')}
                        >
                            Blocked
                        </button>

                        <button
                            className={cn(
                                'ml-2 rounded px-3 py-1 text-sm font-bold transition-all duration-200',
                                view === 'add'
                                    ? 'bg-success text-white'
                                    : 'bg-success/20 text-success hover:bg-success hover:text-white',
                            )}
                            onClick={() => setView('add')}
                        >
                            Add friend
                        </button>
                    </Box>
                </Box>
            </Box>

            <Box className="flex-1 overflow-y-auto">
                {view === 'add' ? (
                    <Box className="animate-in fade-in slide-in-from-top-4 flex h-full flex-col p-8">
                        <Box className="mb-8">
                            <Heading className="mb-2" level={2}>
                                Add friend
                            </Heading>
                            <MutedText>
                                You can add friends with their username.
                            </MutedText>
                        </Box>
                        <Box className="max-w-md">
                            <AddFriendForm />
                        </Box>
                    </Box>
                ) : view === 'pending' ? (
                    !requests || requests.length === 0 ? (
                        <Box className="animate-in fade-in zoom-in flex h-full flex-col items-center justify-center p-8 text-center duration-300">
                            <Box className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bg-subtle">
                                <CheckCircle className="text-foreground-muted h-8 w-8 opacity-20" />
                            </Box>
                            <Heading className="mb-2" level={3}>
                                No pending requests
                            </Heading>
                            <MutedText>
                                You're all caught up! When you receive friend
                                requests, they'll show up here.
                            </MutedText>
                        </Box>
                    ) : (
                        <Box className="space-y-2 p-4">
                            {requests.map((request) => (
                                <FriendRequestItem
                                    fromId={request.fromId || ''}
                                    fromUsername={request.from || ''}
                                    key={request._id}
                                    requestId={request._id}
                                />
                            ))}
                        </Box>
                    )
                ) : view === 'sent' ? (
                    !sentRequests || sentRequests.length === 0 ? (
                        <Box className="animate-in fade-in zoom-in flex h-full flex-col items-center justify-center p-8 text-center duration-300">
                            <Box className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bg-subtle">
                                <CheckCircle className="text-foreground-muted h-8 w-8 opacity-20" />
                            </Box>
                            <Heading className="mb-2" level={3}>
                                No sent requests
                            </Heading>
                            <MutedText>
                                You haven't sent any friend requests lately.
                            </MutedText>
                        </Box>
                    ) : (
                        <Box className="space-y-2 p-4">
                            {sentRequests.map((request) => (
                                <SentFriendRequestItem
                                    key={request._id}
                                    requestId={request._id}
                                    toId={request.toId || ''}
                                    toUsername={request.to || ''}
                                />
                            ))}
                        </Box>
                    )
                ) : view === 'blocked' ? (
                    <Box className="flex h-full flex-col">
                        <Box className="flex-1 overflow-y-auto">
                            <BlockedListMain />
                        </Box>
                    </Box>
                ) : (
                    <Box className="flex h-full flex-col">
                        <Box className="flex-1 overflow-y-auto">
                            <FriendListMain />
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};
