import React from 'react';
import { cn } from '@/utils/cn';

/**
 * @description Secondary navigation bar, 240px wide and full height.
 * Background is 5% lighter than the main background.
 */
export const SecondaryNavBar: React.FC = () => {
    return (
        <aside
            className={cn(
                'h-full w-[240px] shrink-0',
                'bg-linear-to-r from-[--color-background] from-0% to-bg-secondary to-10%'
            )}
        >
            <div className="p-4">{/* Content will go here */}</div>
        </aside>
    );
};
