import React from 'react';

import { MessageSkeleton } from './MessageSkeleton';

export const ChatSkeleton: React.FC = () => (
    <div className="flex flex-col gap-4 py-4">
        <MessageSkeleton />
        <MessageSkeleton />
        <MessageSkeleton />
        <MessageSkeleton />
        <MessageSkeleton />
        <MessageSkeleton />
    </div>
);
