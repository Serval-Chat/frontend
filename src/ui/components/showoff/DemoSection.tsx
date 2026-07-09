import React from 'react';

import { Heading } from '@/ui/components/common/Heading';

interface DemoSectionProps {
    id: string;
    title: string;
    children: React.ReactNode;
}

export const DemoSection = ({
    id,
    title,
    children,
}: DemoSectionProps): React.ReactNode => (
    <section className="p-md font-sans" id={id}>
        <Heading level={2} variant="sub">
            {title}
        </Heading>
        {children}
    </section>
);
