import React from 'react';
import type { CSSProperties } from 'react';

import { type SpacingKey, spacing } from '@/ui/theme';

type Align = 'start' | 'center' | 'end' | 'stretch';
type Justify = 'start' | 'center' | 'end' | 'between';

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    direction?: 'row' | 'col';
    gap?: SpacingKey;
    wrap?: boolean;
    align?: Align;
    justify?: Justify;
}

const alignMap: Record<Align, CSSProperties['alignItems']> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
};

const justifyMap: Record<Justify, CSSProperties['justifyContent']> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
};

export const Stack = ({
    direction = 'col',
    gap = 'md',
    wrap,
    align,
    justify,
    style,
    children,
    ...props
}: StackProps) => {
    const s: CSSProperties = {
        display: 'flex',
        flexDirection: direction === 'row' ? 'row' : 'column',
        gap: spacing[gap],
    };

    if (align !== undefined) s.alignItems = alignMap[align];
    if (justify !== undefined) s.justifyContent = justifyMap[justify];
    if (wrap !== undefined) s.flexWrap = wrap ? 'wrap' : 'nowrap';

    return (
        <div style={{ ...s, ...style }} {...props}>
            {children}
        </div>
    );
};
