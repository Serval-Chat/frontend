import { cn } from '@/utils/cn';

interface BadgeProps {
    count: number;
    className?: string;
    maxCount?: number;
}

export const Badge = ({ count, className, maxCount = 99 }: BadgeProps) => {
    if (count <= 0) return null;

    const displayCount = count > maxCount ? `${maxCount}+` : count;

    return (
        <div
            className={cn(
                'animate-in zoom-in absolute -right-1 -bottom-1 flex h-5 min-w-[20px] items-center justify-center rounded-lg px-1 text-[11px] font-bold shadow-lg ring-[2.5px] ring-background transition-all duration-200',
                className,
            )}
            style={{
                background: 'var(--unread-badge-bg, var(--danger))',
                color: 'var(--unread-badge-text, #ffffff)',
            }}
        >
            {displayCount}
        </div>
    );
};
