import React from 'react';

import { Home, Settings } from 'lucide-react';

import { IconButton } from '@/ui/components/common/IconButton';

export const SpecializedButtons: React.FC = () => (
    <div className="p-4 bg-[--color-background] border border-[--color-border-subtle] rounded-md my-4 flex gap-4">
        <IconButton icon={Home} />
        <IconButton icon={Settings} />
    </div>
);
