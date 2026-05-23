import React from 'react';

import { Hash, Link, Volume2 } from 'lucide-react';

import type { ChannelType } from '@/api/servers/servers.types';
import { ParsedEmoji } from '@/ui/components/common/ParsedEmoji';
import { ParsedUnicodeEmoji } from '@/ui/components/common/ParsedUnicodeEmoji';
import { ICON_MAP } from '@/ui/utils/iconMap';
import { cn } from '@/utils/cn';

interface ChannelIconProps {
    type: ChannelType;
    icon?: string;
    iconComponent?: React.ComponentType<{ className?: string }>;
    emoji?: string;
    emojiType?: 'custom' | 'unicode';
    className?: string;
}

export const ChannelIcon: React.FC<ChannelIconProps> = ({
    type,
    icon,
    iconComponent: IconComponent,
    emoji,
    emojiType,
    className,
}) => {
    const resolvedClassName = cn('shrink-0', className ?? 'h-[18px] w-[18px]');

    if (emoji && emojiType) {
        return (
            <span
                className={cn(
                    'flex items-center justify-center',
                    resolvedClassName,
                )}
            >
                {emojiType === 'custom' ? (
                    <ParsedEmoji className="h-full w-full" emojiId={emoji} />
                ) : (
                    <ParsedUnicodeEmoji
                        className="h-full w-full"
                        content={emoji}
                    />
                )}
            </span>
        );
    }

    const CustomIcon = type !== 'link' && icon ? ICON_MAP[icon] : null;
    const Icon =
        IconComponent ||
        CustomIcon ||
        (type === 'text' ? Hash : type === 'link' ? Link : Volume2);

    return <Icon className={resolvedClassName} />;
};
