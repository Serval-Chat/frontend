import React from 'react';

import { Shield } from 'lucide-react';

import type { Badge } from '@/api/users/users.types';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
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
        <Box
            className={cn(
                'inline-flex shrink-0 cursor-default items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold transition-all',
                className,
            )}
            style={{
                backgroundColor: `${color}20`,
                borderColor: `${color}40`,
                color: color,
            }}
            title={badge.description || badge.name}
        >
            <IconComponent size={12} style={{ color: color }} />
            <Text as="span" className="text-[10px] leading-tight" size="xs">
                {badge.name}
            </Text>
        </Box>
    );
};
