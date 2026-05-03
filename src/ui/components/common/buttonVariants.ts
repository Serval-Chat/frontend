import { type VariantProps, cva } from 'class-variance-authority';

const mutedClasses = {
    normal: 'bg-primary-muted text-primary-muted-text hover:bg-primary-muted',
    danger: 'bg-danger-muted text-danger-muted-text hover:bg-danger-muted',
    caution: 'bg-caution-muted text-caution-muted-text hover:bg-caution-muted',
    success: 'bg-success-muted text-success-muted-text hover:bg-success-muted',
};

export const buttonVariants = cva(
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-background font-sans whitespace-nowrap transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                normal: 'border border-border-subtle text-foreground hover:border-primary/40 hover:bg-bg-secondary',
                primary:
                    'bg-primary text-foreground-inverse hover:bg-primary-hover',
                danger: 'bg-danger text-white hover:bg-danger-hover',
                caution:
                    'bg-caution text-foreground-inverse hover:bg-caution-hover',
                success:
                    'bg-success text-foreground-inverse hover:bg-success-hover',
                nav: 'h-12 w-12 rounded-[1.2rem] bg-bg-secondary p-0 text-foreground transition-all duration-200 hover:rounded-[0.75rem] hover:bg-primary hover:text-foreground-inverse',
                ghost: 'border-none bg-transparent text-foreground shadow-none hover:bg-bg-subtle',
            },
            size: {
                sm: 'px-2 py-1 text-xs',
                md: 'px-xs py-xs text-sm',
                lg: 'px-sm py-sm text-base',
            },
        },
        compoundVariants: Object.entries(mutedClasses).map(
            ([variant, className]) => ({
                variant: variant as keyof typeof mutedClasses,
                loading: true,
                class: className,
            }),
        ),
        defaultVariants: {
            variant: 'normal',
            size: 'md',
        },
    },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
