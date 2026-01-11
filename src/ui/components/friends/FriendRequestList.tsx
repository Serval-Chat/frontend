import React from 'react';

import { CheckCircle } from 'lucide-react';

import { useIncomingRequests } from '@/api/friends/friends.queries';
import { Heading } from '@/ui/components/common/Heading';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { MutedText } from '@/ui/components/common/MutedText';

import { FriendRequestItem } from './FriendRequestItem';

export const FriendRequestList: React.FC = () => {
    const { data: requests, isLoading } = useIncomingRequests();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!requests || requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 mb-4 rounded-full bg-[var(--color-bg-subtle)] flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-foreground-muted opacity-20" />
                </div>
                <Heading level={3} className="mb-2">
                    No pending requests
                </Heading>
                <MutedText>
                    You're all caught up! When you receive friend requests,
                    they'll show up here.
                </MutedText>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-[var(--color-bg-subtle)]">
                <Heading
                    level={2}
                    className="text-xl font-bold flex items-center gap-2"
                >
                    Friend Requests
                    <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                        {requests.length}
                    </span>
                </Heading>
                <MutedText>Accept or decline friend requests.</MutedText>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {requests.map((request) => (
                    <FriendRequestItem
                        key={request._id}
                        requestId={request._id}
                        fromId={request.fromId || ''}
                        fromUsername={request.from || ''}
                    />
                ))}
            </div>
        </div>
    );
};
