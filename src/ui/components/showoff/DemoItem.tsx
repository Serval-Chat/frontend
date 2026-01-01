import React from 'react';
import { Heading } from '@/ui/components/Heading';

interface DemoItemProps {
    id: string;
    title: string;
    children: React.ReactNode;
}

/**
 * @description Container for demo elements
 */
export const DemoItem: React.FC<DemoItemProps> = ({ id, title, children }) => {
    return (
        <div id={id} className="p-xs">
            <Heading level={3} className="text-md font-medium mb-sm">
                {title}
            </Heading>
            {children}
        </div>
    );
};
