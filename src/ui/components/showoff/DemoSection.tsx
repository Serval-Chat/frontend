import React from 'react';
import { Heading } from '@/ui/components/Heading';

interface DemoSectionProps {
    id: string;
    title: string;
    children: React.ReactNode;
}

export function DemoSection({ id, title, children }: DemoSectionProps) {
    return (
        <section id={id} className="p-md font-sans">
            <Heading level={2} variant="sub">
                {title}
            </Heading>
            {children}
        </section>
    );
}
