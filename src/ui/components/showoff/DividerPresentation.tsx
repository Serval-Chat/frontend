import React from 'react';

import { Divider } from '@/ui/components/common/Divider';

export const DividerPresentation: React.FC = () => (
    <div className="p-4 bg-[--color-background] border border-[--color-border-subtle] rounded-md my-4">
        <Divider />
    </div>
);
