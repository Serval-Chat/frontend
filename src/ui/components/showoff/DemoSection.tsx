import React from 'react';

interface DemoSectionProps {
    id: string;
    title: string;
    children: React.ReactNode;
}

export function DemoSection({ id, title, children }: DemoSectionProps) {
    return (
        <section id={id} className="p-md font-sans">
            <h2 className="text-lg font-semibold mb-md">{title}</h2>
            {children}
        </section>
    );
}
