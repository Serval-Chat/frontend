import React from 'react';

import { cn } from '@/utils/cn';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
    children: React.ReactNode;
}

export const Table: React.FC<TableProps> = ({
    children,
    className,
    ...props
}) => (
    <div className="rounded-lg border border-[var(--color-border-subtle)] overflow-hidden">
        <table className={cn('w-full text-sm text-left', className)} {...props}>
            {children}
        </table>
    </div>
);

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
    children: React.ReactNode;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
    children,
    className,
    ...props
}) => (
    <thead
        className={cn(
            'bg-[var(--color-bg-secondary)] text-[var(--color-muted-foreground)] border-b border-[var(--color-border-subtle)]',
            className,
        )}
        {...props}
    >
        {children}
    </thead>
);

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
    children: React.ReactNode;
}

export const TableBody: React.FC<TableBodyProps> = ({
    children,
    className,
    ...props
}) => (
    <tbody
        className={cn(
            'divide-y divide-[var(--color-border-subtle)]',
            className,
        )}
        {...props}
    >
        {children}
    </tbody>
);

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    children: React.ReactNode;
}

export const TableRow: React.FC<TableRowProps> = ({
    children,
    className,
    ...props
}) => (
    <tr
        className={cn(
            'hover:bg-[var(--color-bg-subtle)] transition-colors group',
            className,
        )}
        {...props}
    >
        {children}
    </tr>
);

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
    children: React.ReactNode;
    align?: 'left' | 'center' | 'right';
}

export const TableHead: React.FC<TableHeadProps> = ({
    children,
    className,
    align = 'left',
    ...props
}) => (
    <th
        className={cn(
            'px-4 py-3 font-bold uppercase tracking-wider text-[10px]',
            align === 'center' && 'text-center',
            align === 'right' && 'text-right',
            className,
        )}
        {...props}
    >
        {children}
    </th>
);

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
    children: React.ReactNode;
    align?: 'left' | 'center' | 'right';
    monospace?: boolean;
    muted?: boolean;
}

export const TableCell: React.FC<TableCellProps> = ({
    children,
    className,
    align = 'left',
    monospace,
    muted,
    ...props
}) => (
    <td
        className={cn(
            'px-4 py-4',
            align === 'center' && 'text-center',
            align === 'right' && 'text-right',
            monospace && 'font-mono',
            muted && 'text-[var(--color-muted-foreground)]',
            className,
        )}
        {...props}
    >
        {children}
    </td>
);
