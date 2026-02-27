import React, { useState } from 'react';

import { Link as RouterLink, useNavigate } from 'react-router-dom';

import { cn } from '@/utils/cn';

import { ConfirmLinkModal } from './ConfirmLinkModal';

export type LinkSize = '2xs' | 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';

const sizeClasses: Record<LinkSize, string> = {
    '2xs': 'text-[10px] leading-normal',
    xs: 'text-xs leading-normal',
    sm: 'text-sm leading-normal',
    base: 'text-base leading-normal',
    lg: 'text-lg leading-normal',
    xl: 'text-xl leading-normal',
    '2xl': 'text-2xl leading-normal',
};

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href?: string;
    to?: string;
    children: React.ReactNode;
    external?: boolean;
    size?: LinkSize;
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
    size,
    onClick,
    ...props
}) => {
    const sizeClass = size ? sizeClasses[size] : undefined;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const targetUrl = to || href || '#';
    const isInternal = to !== undefined && !external;
    const navigate = useNavigate();

    const baseClass = 'text-primary hover:underline transition-all text-base';

    if (isInternal) {
        return (
            <RouterLink
                className={cn(baseClass, sizeClass, className)}
                to={to!}
                onClick={onClick}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...(props as Omit<
                    LinkProps,
                    'to' | 'href' | 'external' | 'size'
                >)}
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
            let isSafe = false;
            let isInternalSetting = false;
            let internalPath = '';

            try {
                const parsed = new URL(targetUrl);
                if (
                    parsed.hostname === 'catfla.re' ||
                    parsed.hostname.endsWith('.catfla.re')
                ) {
                    if (parsed.pathname.startsWith('/chat/@setting')) {
                        isInternalSetting = true;
                        internalPath = parsed.pathname;
                    } else {
                        isSafe = true;
                    }
                }
            } catch {
                // ignore
            }

            if (isInternalSetting) {
                void navigate(internalPath);
            } else if (isSafe) {
                window.open(targetUrl, '_blank', 'noopener,noreferrer');
            } else {
                setIsModalOpen(true);
            }
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
                className={cn(baseClass, sizeClass, className)}
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
