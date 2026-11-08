import { CategorySkeleton } from './CategorySkeleton';
import { ChannelSkeleton } from './ChannelSkeleton';

export const SidebarSkeleton = () => (
    <div className="flex flex-col px-2 py-4">
        <CategorySkeleton />
        <ChannelSkeleton />
        <ChannelSkeleton />
        <ChannelSkeleton />
        <CategorySkeleton />
        <ChannelSkeleton />
        <ChannelSkeleton />
    </div>
);
