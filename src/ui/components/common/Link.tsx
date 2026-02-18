import React, { useState } from 'react';

import { Link as RouterLink } from 'react-router-dom';

import { cn } from '@/utils/cn';

import { ConfirmLinkModal } from './ConfirmLinkModal';

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
    onClick,
    ...props
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const targetUrl = to || href || '#';
    const isInternal = to !== undefined && !external;

    const baseClass = 'text-primary hover:underline transition-all';

    if (isInternal) {
        return (
            <RouterLink
                className={cn(baseClass, className)}
                to={to!}
                onClick={onClick}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...(props as Omit<LinkProps, 'to' | 'href' | 'external'>)}
            >
                {children}
            </RouterLink>
        );
    }

    const isExternal =
        external ?? (href?.startsWith('http') || href?.startsWith('//'));

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
        if (isExternal) {
            e.preventDefault();
            setIsModalOpen(true);
        }
        onClick?.(e);
    };

    const handleConfirm = (): void => {
        setIsModalOpen(false);
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <>
            <a
                className={cn(baseClass, className)}
                href={targetUrl}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                target={isExternal ? '_blank' : undefined}
                onClick={handleClick}
                {...props}
            >
                {children}
            </a>

            {isExternal && (
                <ConfirmLinkModal
                    isOpen={isModalOpen}
                    url={targetUrl}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleConfirm}
                />
            )}
        </>
    );
};
