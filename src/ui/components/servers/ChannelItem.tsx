import React from 'react';

import { Hash, Volume2 } from 'lucide-react';

import type { ChannelType } from '@/api/servers/servers.types';
import { Button } from '@/ui/components/common/Button';
import { ICON_MAP } from '@/ui/utils/iconMap';
import { cn } from '@/utils/cn';

interface ChannelItemProps {
    name: string;
    type: ChannelType;
    icon?: string;
    isActive?: boolean;
    isUnread?: boolean;
    onClick?: () => void;
}

/**
 * @description Renders a single channel item with an icon.
 */
export const ChannelItem: React.FC<ChannelItemProps> = ({
    name,
    type,
    icon,
    isActive,
    isUnread,
    onClick,
}) => {
    const CustomIcon = icon ? ICON_MAP[icon] : null;
    const Icon = CustomIcon || (type === 'text' ? Hash : Volume2);

    const channelClasses = cn(
        'group flex items-center w-full px-2 py-1.5 rounded-md transition-all border-none shadow-none justify-start',
        'hover:bg-white/5 cursor-pointer text-left',
        isActive
            ? 'bg-white/10 text-foreground'
            : isUnread
              ? 'text-foreground'
              : 'text-muted-foreground',
    );

    return (
        <Button className={channelClasses} variant="ghost" onClick={onClick}>
            <Icon
                className={cn(
                    'w-[18px] h-[18px] mr-1.5 shrink-0 transition-colors',
                    isActive || isUnread
                        ? 'text-foreground'
                        : 'text-muted-foreground group-hover:text-foreground/80',
                )}
            />
            <span
                className={cn(
                    'text-[15px] font-medium truncate',
                    (isActive || isUnread) && 'text-foreground',
                )}
            >
                {name}
            </span>
        </Button>
    );
};
