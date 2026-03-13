import React from 'react';

import { Hash, Link, Settings, Volume2 } from 'lucide-react';

import type { ChannelType } from '@/api/servers/servers.types';
import { buttonVariants } from '@/ui/components/common/Button';
import { IconButton } from '@/ui/components/common/IconButton';
import { ICON_MAP } from '@/ui/utils/iconMap';
import { cn } from '@/utils/cn';

interface ChannelItemProps {
    name: string;
    type: ChannelType;
    icon?: string;
    isActive?: boolean;
    isUnread?: boolean;
    pingCount?: number;
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
    pingCount,
    onClick,
    onSettingsClick,
}) => {
    // custom icons don't apply to pseudochannels
    const CustomIcon = type !== 'link' && icon ? ICON_MAP[icon] : null;
    const Icon =
        CustomIcon ||
        (type === 'text' ? Hash : type === 'link' ? Link : Volume2);

    const channelClasses = cn(
        'group flex w-full items-center justify-between rounded-md border-none px-2 py-1.5 shadow-none transition-all',
        'cursor-pointer hover:bg-white/5',
        isActive
            ? 'bg-white/10 text-foreground'
            : isUnread
              ? 'text-foreground'
              : 'text-muted-foreground',
    );

    return (
        <div
            className={cn(
                'relative',
                buttonVariants({ variant: 'ghost' }),
                channelClasses,
            )}
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick?.();
                }
            }}
        >
            <span className="gap-inherit flex w-full items-center justify-between">
                <div className="flex min-w-0 flex-1 items-center">
                    <Icon
                        className={cn(
                            'mr-1.5 h-[18px] w-[18px] shrink-0 transition-colors',
                            isActive || isUnread
                                ? 'text-foreground'
                                : 'text-muted-foreground group-hover:text-foreground/80',
                        )}
                    />
                    <span
                        className={cn(
                            'truncate text-left text-[15px] font-medium',
                            (isActive || isUnread) && 'text-foreground',
                        )}
                    >
                        {name}
                    </span>
                    {pingCount
                        ? pingCount > 0 && (
                              <div className="ml-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1.5 text-[10px] leading-none font-bold text-white">
                                  {pingCount > 99 ? '99+' : pingCount}
                              </div>
                          )
                        : null}
                </div>
                {onSettingsClick && (
                    <IconButton
                        className="ml-1 shrink-0 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                        icon={Settings}
                        iconSize={14}
                        title="Edit Channel"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSettingsClick(e);
                        }}
                    />
                )}
            </span>
        </div>
    );
};
