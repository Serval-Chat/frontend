import React from 'react';

import { cn } from '@/utils/cn';

export interface BoxProps extends React.HTMLAttributes<HTMLElement> {
    children?: React.ReactNode;
    as?: React.ElementType;
    [key: string]: unknown;
}

/**
 * @description Generic wrapper in case I want to use react native in the future tho i reallly fucking spam classnames lol
 */
export const Box = React.forwardRef<HTMLElement, BoxProps>(
    ({ children, className, as: Tag = 'div', ...props }, ref) => {
        const Component = Tag as React.ElementType;
        return (
            <Component
                className={cn(className as string)}
                ref={ref}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...props}
            >
                {children}
            </Component>
        );
    },
);

Box.displayName = 'Box';
