import React from 'react';

import { CategorySkeleton } from './CategorySkeleton';
import { ChannelSkeleton } from './ChannelSkeleton';

export const SidebarSkeleton: React.FC = () => (
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
