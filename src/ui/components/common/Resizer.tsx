import React from 'react';

import { cn } from '@/utils/cn';

interface ResizerProps {
    onMouseDown: (e: React.MouseEvent) => void;
    isResizing?: boolean;
    side: 'left' | 'right';
    className?: string;
}

/**
 * A thin vertical bar that acts as a drag handle for resizing.
 */
export const Resizer: React.FC<ResizerProps> = ({
    onMouseDown,
    isResizing,
    side,
    className,
}) => (
    <div
        className={cn(
            'absolute top-0 bottom-0 w-1 cursor-col-resize z-50 transition-colors group hover:bg-primary/30',
            side === 'left' ? 'left-0' : 'right-0',
            isResizing && 'bg-primary/50',
            className,
        )}
        role="presentation"
        onMouseDown={onMouseDown}
    >
        {/* Visual indicator bar */}
        <div
            className={cn(
                'absolute top-0 bottom-0 w-[1px] bg-border-subtle group-hover:bg-primary/50 transition-colors',
                side === 'left' ? 'left-0' : 'right-0',
            )}
        />
    </div>
);
