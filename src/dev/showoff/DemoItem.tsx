import React from 'react';

import { Heading } from '@/ui/primitives/Heading';

interface DemoItemProps {
    id: string;
    title: string;
    children: React.ReactNode;
}

/**
 * @description Container for demo elements
 */
export const DemoItem = ({ id, title, children }: DemoItemProps) => (
    <div className="p-xs" id={id}>
        <Heading className="mb-sm text-base font-medium" level={3}>
            {title}
        </Heading>
        {children}
    </div>
);
