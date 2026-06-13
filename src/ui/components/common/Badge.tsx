import { colors } from '@/ui/theme';
import { cn } from '@/utils/cn';

interface BadgeProps {
    count: number;
    maxCount?: number;
    className?: string;
    style?: React.CSSProperties;
}

export const Badge = ({
    count,
    maxCount = 99,
    className,
    style,
}: BadgeProps) => {
    if (count <= 0) return null;

    const displayCount = count > maxCount ? `${maxCount}+` : count;

    return (
        <div
            className={cn(className)}
            style={{
                position: 'absolute',
                right: '-4px',
                bottom: '-4px',
                display: 'flex',
                minWidth: '20px',
                height: '20px',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                paddingInline: '4px',
                fontSize: '11px',
                fontWeight: '700',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.4)',
                outline: `2.5px solid ${colors.background}`,
                backgroundColor: colors.unreadBadgeBg,
                color: colors.unreadBadgeText,
                transition: 'all 0.2s',
                ...style,
            }}
        >
            {displayCount}
        </div>
    );
};
