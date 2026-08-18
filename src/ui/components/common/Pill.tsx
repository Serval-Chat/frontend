import { cn } from '@/utils/cn';

export type PillVariant = 'success' | 'caution' | 'danger' | 'primary' | 'neutral';

interface PillProps {
    children: React.ReactNode;
    variant?: PillVariant;
    className?: string;
}

const variantStyles: Record<PillVariant, string> = {
    success: 'border-success/40 bg-success/10 text-success',
    caution: 'border-caution/40 bg-caution/10 text-caution',
    danger: 'border-danger/40 bg-danger/10 text-danger',
    primary: 'border-primary/40 bg-primary/10 text-primary',
    neutral: 'border-border-subtle bg-bg-subtle text-muted-foreground',
};

export const Pill = ({ children, variant = 'neutral', className }: PillProps) => (
    <span
        className={cn(
            'inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase',
            variantStyles[variant],
            className,
        )}
    >
        {children}
    </span>
);
