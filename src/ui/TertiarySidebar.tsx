import React from 'react';
import { cn } from '@/utils/cn';

/**
 * @description Tertiary sidebar
 */
export const TertiarySidebar: React.FC = () => {
    return (
        <aside
            className={cn(
                'h-full w-[240px] shrink-0',
                'bg-linear-to-r from-[--color-background] from-0% to-bg-secondary to-10%'
            )}
        >
            <div className="p-4"></div>
        </aside>
    );
};
