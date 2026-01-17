import React from 'react';

import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

interface GradientTextProps extends React.HTMLAttributes<HTMLDivElement> {
    colors: string[];
    angle?: number;
    repeating?: boolean;
    children: React.ReactNode;
}

export const GradientText: React.FC<GradientTextProps> = ({
    colors,
    angle = 45,
    repeating = false,
    children,
    className,
    style,
    ...props
}) => {
    const gradientFunction = repeating
        ? 'repeating-linear-gradient'
        : 'linear-gradient';
    const gradientString =
        colors.length === 1 ? `${colors[0]}, ${colors[0]}` : colors.join(', ');

    const background = `${gradientFunction}(${angle}deg, ${gradientString})`;

    return (
        <Box
            className={cn('font-bold text-xl w-fit', className)}
            style={{
                background: background,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                ...style,
            }}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
        >
            {children}
        </Box>
    );
};
