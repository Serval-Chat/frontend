import React from 'react';

import { Skeleton } from '@/ui/components/common/Skeleton';

export const MessageSkeleton: React.FC = () => (
    <div className="flex gap-4 px-4 py-2">
        <Skeleton
            className="shrink-0"
            height={40}
            variant="circular"
            width={40}
        />
        <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center gap-2">
                <Skeleton height={16} variant="text" width="120px" />
                <Skeleton height={12} variant="text" width="60px" />
            </div>
            <Skeleton height={14} variant="text" width="90%" />
            <Skeleton height={14} variant="text" width="70%" />
        </div>
    </div>
);
