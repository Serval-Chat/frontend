import React from 'react';

import { Skeleton } from '@/ui/components/common/Skeleton';
import { cn } from '@/utils/cn';

interface MessageSkeletonProps {
    isCompact?: boolean;
}

export const MessageSkeleton: React.FC<MessageSkeletonProps> = ({
    isCompact,
}) => {
    const primaryWidth = isCompact ? '66%' : '82%';
    const secondaryWidth = isCompact ? '38%' : '54%';

    return (
        <div
            className={cn(
                'flex w-full gap-4 px-4 transition-all duration-300',
                isCompact ? 'py-0.5' : 'py-2',
            )}
        >
            {!isCompact && (
                <Skeleton
                    className="shrink-0 rounded-full"
                    height={40}
                    variant="circular"
                    width={40}
                />
            )}
            {isCompact && <div className="w-10 shrink-0" />}
            <div className="flex flex-1 flex-col gap-2">
                {!isCompact && (
                    <div className="flex items-center gap-2">
                        <Skeleton height={14} variant="text" width="100px" />
                        <Skeleton height={10} variant="text" width="50px" />
                    </div>
                )}
                <div className="flex flex-col gap-1.5">
                    <Skeleton height={12} variant="text" width={primaryWidth} />
                    <Skeleton
                        height={12}
                        variant="text"
                        width={secondaryWidth}
                    />
                </div>
            </div>
        </div>
    );
};
