import React from 'react';

import { Skeleton } from '@/ui/components/common/Skeleton';

export const CategorySkeleton: React.FC = () => (
    <div className="mt-4 flex items-center px-1 py-2 first:mt-0">
        <Skeleton
            className="mr-1"
            height={12}
            variant="rectangular"
            width={12}
        />
        <Skeleton height={12} variant="text" width="40%" />
    </div>
);
