import React from 'react';

import { cn } from '@/utils/cn';

export type HeadingVariant =
    | 'page'
    | 'section'
    | 'sub'
    | 'chat-h1'
    | 'chat-h2'
    | 'chat-h3'
    | 'admin-page'
    | 'admin-section'
    | 'admin-sub';

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    variant?: HeadingVariant;
}

const headingClassMap: Record<HeadingVariant, string> = {
    page: 'text-3xl tracking-tight text-foreground font-bold',
    section: 'my-md font-sans text-xl font-bold',
    sub: 'mb-md text-lg font-semibold',
    'chat-h1': 'mt-1 mb-0.5 text-2xl font-bold',
    'chat-h2': 'mt-0.5 mb-0 text-xl font-bold',
    'chat-h3': 'mt-0.5 mb-0 text-lg font-bold',
    'admin-page': 'text-2xl font-black tracking-tight',
    'admin-section': 'text-xl font-black tracking-tight uppercase',
    'admin-sub': 'text-sm font-black tracking-wider uppercase',
};

export const Heading = ({
    level = 1,
    variant = 'page',
    className,
    style,
    children,
    ...props
}: HeadingProps) => {
    const Tag = `h${level}` as React.ElementType;
    return (
        <Tag
            className={cn(headingClassMap[variant], className)}
            style={style}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
        >
            {children}
        </Tag>
    );
};
