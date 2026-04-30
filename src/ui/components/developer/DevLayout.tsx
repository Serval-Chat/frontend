import type { ReactNode } from 'react';

import { Heading } from '@/ui/components/common/Heading';

interface DevLayoutProps {
    children: ReactNode;
    sidebar: ReactNode;
    title: string;
}

export const DevLayout = ({
    children,
    sidebar,
    title,
}: DevLayoutProps): ReactNode => (
    <div className="flex min-h-screen w-full bg-bg-primary">
        {sidebar}
        <div className="flex flex-1 flex-col">
            <div className="flex items-center border-b border-border-subtle px-6 py-4">
                <Heading className="text-xl" level={1}>
                    {title}
                </Heading>
            </div>
            <div className="p-6">{children}</div>
        </div>
    </div>
);
