import React from 'react';

import { Heading } from '@/ui/components/common/Heading';

interface DemoItemProps {
    id: string;
    title: string;
    children: React.ReactNode;
}

/**
 * @description Container for demo elements
 */
export const DemoItem: React.FC<DemoItemProps> = ({ id, title, children }) => (
    <div className="p-xs" id={id}>
        <Heading className="text-md font-medium mb-sm" level={3}>
            {title}
        </Heading>
        {children}
    </div>
);
