import React from 'react';
import { NormalText } from '@/ui/components/common/NormalText';
import { cn } from '@/utils/cn';

/**
 * @description Main chat area content component.
 */
export const MainContent: React.FC = () => {
    return (
        <main
            className={cn(
                'flex-1 flex flex-col items-center justify-center relative z-10',
                'bg-linear-to-r from-bg-secondary from-0% to-[--color-background] to-10%'
            )}
        >
            <NormalText>nothing here yet but us servals~!</NormalText>
        </main>
    );
};
