import { Skeleton } from '@/ui/components/common/Skeleton';
import { cn } from '@/utils/cn';

export type PillVariant =
    | 'success'
    | 'caution'
    | 'danger'
    | 'primary'
    | 'neutral';

interface PillProps {
    children: React.ReactNode;
    variant?: PillVariant;
    className?: string;
    /** Renders this pill as a skeleton placeholder, sized to the real content. */
    skeleton?: boolean;
}

const variantStyles: Record<PillVariant, string> = {
    success: 'border-success/40 bg-success/10 text-success',
    caution: 'border-caution/40 bg-caution/10 text-caution',
    danger: 'border-danger/40 bg-danger/10 text-danger',
    primary: 'border-primary/40 bg-primary/10 text-primary',
    neutral: 'border-border-subtle bg-bg-subtle text-muted-foreground',
};

export const Pill = ({
    children,
    variant = 'neutral',
    className,
    skeleton,
}: PillProps) => (
    <span
        aria-hidden={skeleton || undefined}
        className={cn(
            'relative inline-flex shrink-0 items-center rounded-sm border px-2 py-1 text-[10px] leading-none font-semibold uppercase',
            variantStyles[variant],
            className,
        )}
    >
        {skeleton ? (
            <>
                <span style={{ visibility: 'hidden' }}>{children}</span>
                <Skeleton className="absolute inset-0 rounded-sm" />
            </>
        ) : (
            children
        )}
    </span>
);
