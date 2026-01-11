import React from 'react';

import { Shield } from 'lucide-react';

import type { Badge } from '@/api/users/users.types';
import { ICON_MAP } from '@/ui/utils/iconMap';
import { cn } from '@/utils/cn';

interface UserBadgeProps {
    badge: Badge;
    className?: string;
}

export const UserBadge: React.FC<UserBadgeProps> = ({ badge, className }) => {
    const IconComponent = ICON_MAP[badge.icon] || Shield;
    const color = badge.color || '#747F8D';

    return (
        <div
            className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold cursor-default transition-all border shrink-0',
                className
            )}
            style={{
                backgroundColor: `${color}20`,
                borderColor: `${color}40`,
                color: color,
            }}
            title={badge.description || badge.name}
        >
            <IconComponent size={12} style={{ color: color }} />
            <span>{badge.name}</span>
        </div>
    );
};
