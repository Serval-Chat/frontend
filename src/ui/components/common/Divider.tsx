import type { CSSProperties } from 'react';

import { colors } from '@/ui/theme';
import { cn } from '@/utils/cn';

import { Text } from './Text';

interface DividerProps {
    variant?: 'bar' | 'line';
    text?: string;
    fullWidth?: boolean;
    className?: string;
    style?: CSSProperties;
}

export const Divider = ({
    variant = 'bar',
    text,
    fullWidth,
    className,
    style,
}: DividerProps) => {
    if (variant === 'line') {
        if (!text) {
            return (
                <hr
                    className={cn('w-full border-neutral-600/50', className)}
                    style={style}
                />
            );
        }

        return (
            <div
                className={cn('flex w-full items-center gap-3', className)}
                style={style}
            >
                <hr className="flex-1 border-neutral-600/50" />
                <Text className="shrink-0" size="xs" variant="muted">
                    {text}
                </Text>
                <hr className="flex-1 border-neutral-600/50" />
            </div>
        );
    }

    return (
        <div
            className={cn(className)}
            style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                paddingBlock: '2px',
                paddingInline: fullWidth ? 0 : '12px',
                ...style,
            }}
        >
            <div
                style={{
                    height: '3px',
                    width: '100%',
                    borderRadius: '9999px',
                    backgroundColor: colors.divider,
                }}
            />
        </div>
    );
};
