import React from 'react';

import { Hash, Link, Settings, Volume2 } from 'lucide-react';

import type { ChannelType } from '@/api/servers/servers.types';
import { Button } from '@/ui/components/common/Button';
import { IconButton } from '@/ui/components/common/IconButton';
import { ICON_MAP } from '@/ui/utils/iconMap';
import { cn } from '@/utils/cn';

interface ChannelItemProps {
    name: string;
    type: ChannelType;
    icon?: string;
    isActive?: boolean;
    isUnread?: boolean;
    onClick?: () => void;
    onSettingsClick?: (e: React.MouseEvent) => void;
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
    onSettingsClick,
}) => {
    // custom icons don't apply to pseudochannels
    const CustomIcon = type !== 'link' && icon ? ICON_MAP[icon] : null;
    const Icon =
        CustomIcon ||
        (type === 'text' ? Hash : type === 'link' ? Link : Volume2);

    const channelClasses = cn(
        'group flex items-center justify-between w-full px-2 py-1.5 rounded-md transition-all border-none shadow-none',
        'hover:bg-white/5 cursor-pointer',
        isActive
            ? 'bg-white/10 text-foreground'
            : isUnread
              ? 'text-foreground'
              : 'text-muted-foreground',
    );

    return (
        <Button
            className={channelClasses}
            innerClassName="w-full justify-between"
            variant="ghost"
            onClick={onClick}
        >
            <div className="flex items-center flex-1 min-w-0">
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
                        'text-[15px] font-medium truncate text-left',
                        (isActive || isUnread) && 'text-foreground',
                    )}
                >
                    {name}
                </span>
            </div>
            {onSettingsClick && (
                <IconButton
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 ml-1 shrink-0"
                    icon={Settings}
                    iconSize={14}
                    title="Edit Channel"
                    variant="ghost"
                    onClick={onSettingsClick}
                />
            )}
        </Button>
    );
};
