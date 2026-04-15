import React from 'react';

import { Skeleton } from '@/ui/components/common/Skeleton';

export const ChannelSkeleton: React.FC = () => (
    <div className="flex items-center gap-2 px-2 py-1.5">
        <Skeleton height={18} variant="circular" width={18} />
        <Skeleton height={14} variant="text" width="60%" />
    </div>
);
