import { MessageSkeleton } from './MessageSkeleton';

export const ChatSkeleton = () => (
    <div className="flex flex-col gap-1 py-4">
        <MessageSkeleton />
        <MessageSkeleton isCompact />
        <MessageSkeleton isCompact />
        <MessageSkeleton />
        <MessageSkeleton isCompact />
        <MessageSkeleton />
        <MessageSkeleton isCompact />
        <MessageSkeleton isCompact />
        <MessageSkeleton />
        <MessageSkeleton isCompact />
        <MessageSkeleton />
        <MessageSkeleton isCompact />
    </div>
);
