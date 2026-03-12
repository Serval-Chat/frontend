import React from 'react';

import {
    AlertTriangle,
    BookOpen,
    Bug,
    CheckCircle,
    Code,
    FileText,
    HelpCircle,
    Info,
    ListTodo,
    Quote,
    XCircle,
    Zap,
} from 'lucide-react';

import { cn } from '@/utils/cn';
import type { AdmonitionNode } from '@/utils/textParser/types';

import type { Text } from './Text';

interface AdmonitionProps {
    node: AdmonitionNode;
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
    wrap?: React.ComponentProps<typeof Text>['wrap'];
    isNested?: boolean;
    children?: React.ReactNode;
}

function getAdmonitionTheme(admonitionType: string): {
    border: string;
    bg: string;
    titleColor: string;
    icon: React.ElementType;
} {
    switch (admonitionType) {
        case 'warning':
        case 'caution':
        case 'attention':
            return {
                border: 'border-caution',
                bg: 'bg-caution-muted/40',
                titleColor: 'text-caution-muted-text',
                icon: AlertTriangle,
            };

        case 'bug':
            return {
                border: 'border-danger',
                bg: 'bg-danger-muted/40',
                titleColor: 'text-danger-muted-text',
                icon: Bug,
            };

        case 'danger':
        case 'error':
        case 'failure':
            return {
                border: 'border-danger',
                bg: 'bg-danger-muted/40',
                titleColor: 'text-danger-muted-text',
                icon: XCircle,
            };

        case 'success':
            return {
                border: 'border-success',
                bg: 'bg-success-muted/40',
                titleColor: 'text-success-muted-text',
                icon: Zap,
            };

        case 'tip':
        case 'hint':
            return {
                border: 'border-success',
                bg: 'bg-success-muted/40',
                titleColor: 'text-success-muted-text',
                icon: CheckCircle,
            };

        case 'question':
        case 'help':
        case 'faq':
            return {
                border: 'border-primary',
                bg: 'bg-primary-muted/40',
                titleColor: 'text-primary-muted-text',
                icon: HelpCircle,
            };

        case 'todo':
            return {
                border: 'border-primary',
                bg: 'bg-primary-muted/40',
                titleColor: 'text-primary-muted-text',
                icon: ListTodo,
            };

        case 'quote':
        case 'cite':
            return {
                border: 'border-primary',
                bg: 'bg-primary-muted/40',
                titleColor: 'text-primary-muted-text',
                icon: Quote,
            };

        case 'example':
            return {
                border: 'border-primary',
                bg: 'bg-primary-muted/40',
                titleColor: 'text-primary-muted-text',
                icon: Code,
            };

        case 'abstract':
        case 'summary':
        case 'tldr':
            return {
                border: 'border-success',
                bg: 'bg-success-muted/40',
                titleColor: 'text-success-muted-text',
                icon: FileText,
            };

        case 'seealso':
            return {
                border: 'border-success',
                bg: 'bg-success-muted/40',
                titleColor: 'text-success-muted-text',
                icon: BookOpen,
            };

        case 'note':
        case 'info':
        case 'important':
        default:
            return {
                border: 'border-primary',
                bg: 'bg-primary-muted/40',
                titleColor: 'text-primary-muted-text',
                icon: Info,
            };
    }
}

/**
 * Renders an admonition
 */
export const Admonition: React.FC<AdmonitionProps> = ({
    node,
    isNested,
    children,
}) => {
    const theme = getAdmonitionTheme(node.admonitionType);
    const displayTitle =
        node.title ??
        node.admonitionType.charAt(0).toUpperCase() +
            node.admonitionType.slice(1);

    const header = (
        <div
            className={cn(
                'flex items-center gap-1.5 font-semibold text-sm select-none',
                theme.titleColor,
            )}
        >
            <span aria-hidden className="leading-none mt-[1px]">
                <theme.icon size={16} />
            </span>
            <span>{displayTitle}</span>
            {node.collapsible && (
                <span className="ml-auto text-xs opacity-60 leading-none">
                    ▾
                </span>
            )}
        </div>
    );

    const containerClass = cn(
        'rounded-md border-l-4 pl-3 pr-3 pt-2 pb-2 text-sm',
        theme.border,
        theme.bg,
        !isNested && 'my-2',
    );

    if (node.collapsible) {
        return (
            <details
                className={containerClass}
                open={node.defaultOpen !== false}
            >
                <summary className="list-none cursor-pointer">{header}</summary>
                {children && <div className="mt-1.5">{children}</div>}
            </details>
        );
    }

    return (
        <div className={containerClass}>
            {header}
            {children && <div className="mt-1.5">{children}</div>}
        </div>
    );
};
