import type { ComponentType } from 'react';

import { cn } from '@/utils/cn';

import { Text } from './Text';

export type CalloutBoxVariant = 'caution' | 'danger';

const ICON_SIZE = 20;

interface CalloutBoxIconProps {
    className?: string;
    size?: number;
}

interface CalloutBoxProps {
    variant?: CalloutBoxVariant;
    icon?: ComponentType<CalloutBoxIconProps>;
    title?: string;
    className?: string;
    children: React.ReactNode;
}

const variantTheme: Record<
    CalloutBoxVariant,
    { border: string; bg: string; icon: string }
> = {
    caution: {
        border: 'border-caution/20',
        bg: 'bg-caution/10',
        icon: 'text-caution',
    },
    danger: {
        border: 'border-danger/20',
        bg: 'bg-danger/10',
        icon: 'text-danger',
    },
};

export const CalloutBox = ({
    variant = 'caution',
    icon: Icon,
    title,
    className,
    children,
}: CalloutBoxProps): React.ReactNode => {
    const theme = variantTheme[variant];

    return (
        <div
            className={cn(
                'flex items-start gap-3 rounded-lg border p-4',
                theme.border,
                theme.bg,
                className,
            )}
        >
            {Icon ? (
                <Icon
                    className={cn('mt-0.5 shrink-0', theme.icon)}
                    size={ICON_SIZE}
                />
            ) : null}
            <div className="min-w-0 flex-1">
                {title !== undefined ? (
                    <Text
                        as="p"
                        className="mb-2"
                        size="sm"
                        variant={variant}
                        weight="bold"
                    >
                        {title}
                    </Text>
                ) : null}
                {children}
            </div>
        </div>
    );
};
