import React from 'react';

import { cn } from '@/utils/cn';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
    children: React.ReactNode;
    fullWidth?: boolean;
}

export const Table: React.FC<TableProps> = ({
    children,
    className,
    fullWidth = true,
    ...props
}) => (
    <div
        className={cn(
            'overflow-hidden rounded-lg border border-border-subtle',
            !fullWidth && 'w-fit max-w-full',
        )}
    >
        <table
            className={cn(
                'text-left text-sm',
                fullWidth ? 'w-full' : 'w-full',
                className,
            )}
            {...props}
        >
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
            'border-b border-border-subtle bg-bg-secondary text-muted-foreground',
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
        className={cn('divide-y divide-border-subtle', className)}
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
        className={cn('group transition-colors hover:bg-bg-subtle', className)}
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
            'border-r border-border-subtle px-4 py-3 text-[10px] font-bold tracking-wider uppercase last:border-0',
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
            'border-r border-border-subtle px-4 py-4 last:border-0',
            align === 'center' && 'text-center',
            align === 'right' && 'text-right',
            monospace && 'font-mono',
            muted && 'text-muted-foreground',
            className,
        )}
        {...props}
    >
        {children}
    </td>
);
