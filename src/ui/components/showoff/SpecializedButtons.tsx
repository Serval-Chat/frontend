import { Home, Settings } from 'lucide-react';

import { IconButton } from '@/ui/components/common/IconButton';

export const SpecializedButtons = () => (
    <div className="my-4 flex gap-4 rounded-md border border-[--color-border-subtle] bg-[--color-background] p-4">
        <IconButton aria-label="Home" icon={Home} />
        <IconButton aria-label="Settings" icon={Settings} />
    </div>
);
