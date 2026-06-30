import { Shield } from 'lucide-react';

import type { Badge } from '@/api/users/users.types';
import { Text } from '@/ui/components/common/Text';
import { Tooltip } from '@/ui/components/common/Tooltip';
import { Box } from '@/ui/components/layout/Box';
import { ICON_MAP } from '@/ui/utils/iconMap';
import { cn } from '@/utils/cn';

interface UserBadgeProps {
    badge: Badge;
    className?: string;
    solidBg?: boolean;
    darkCard?: boolean;
}

export const UserBadge = ({
    badge,
    className,
    solidBg,
    darkCard,
}: UserBadgeProps) => {
    const IconComponent = ICON_MAP[badge.icon] || Shield;
    const color = badge.color || '#747F8D';

    let style: React.CSSProperties;
    if (solidBg && darkCard) {
        style = {
            backgroundColor: 'rgba(0,0,0,0.45)',
            borderColor: `${color}99`,
            color,
        };
    } else if (solidBg) {
        style = {
            backgroundColor: 'rgba(255,255,255,0.93)',
            borderColor: color,
            color,
        };
    } else {
        style = {
            backgroundColor: `${color}20`,
            borderColor: `${color}40`,
            color,
        };
    }

    return (
        <Tooltip content={badge.description || badge.name} position="top">
            <Box
                className={cn(
                    'inline-flex shrink-0 cursor-default items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold transition-all',
                    className,
                )}
                style={style}
            >
                <IconComponent size={12} style={{ color }} />
                <Text as="span" className="text-[10px] leading-tight" size="xs">
                    {badge.name}
                </Text>
            </Box>
        </Tooltip>
    );
};
