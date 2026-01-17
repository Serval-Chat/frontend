import React from 'react';

import { Link as RouterLink } from 'react-router-dom';

import { cn } from '@/utils/cn';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href?: string;
    to?: string;
    children: React.ReactNode;
    external?: boolean;
}

/**
 * @description Link component. Support links and router links
 */
export const Link: React.FC<LinkProps> = ({
    href,
    to,
    children,
    className,
    external,
    ...props
}) => {
    const targetUrl = to || href || '#';
    const isInternal = to !== undefined && !external;

    const baseClass = 'text-primary hover:underline transition-all';

    if (isInternal) {
        return (
            <RouterLink
                className={cn(baseClass, className)}
                to={to!}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...(props as Omit<LinkProps, 'to' | 'href' | 'external'>)}
            >
                {children}
            </RouterLink>
        );
    }

    const isExternal =
        external ?? (href?.startsWith('http') || href?.startsWith('//'));

    return (
        <a
            className={cn(baseClass, className)}
            href={targetUrl}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            target={isExternal ? '_blank' : undefined}
            {...props}
        >
            {children}
        </a>
    );
};
