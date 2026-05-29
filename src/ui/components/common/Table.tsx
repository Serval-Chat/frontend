import React from 'react';

import { cn } from '@/utils/cn';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
    children: React.ReactNode;
    fullWidth?: boolean;
}

export const Table = ({
    children,
    className,
    fullWidth = true,
    ...props
}: TableProps) => (
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

export const TableHeader = ({
    children,
    className,
    ...props
}: TableHeaderProps) => (
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

export const TableBody = ({
    children,
    className,
    ...props
}: TableBodyProps) => (
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

export const TableRow = ({ children, className, ...props }: TableRowProps) => (
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

export const TableHead = ({
    children,
    className,
    align = 'left',
    ...props
}: TableHeadProps) => (
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

export const TableCell = ({
    children,
    className,
    align = 'left',
    monospace,
    muted,
    ...props
}: TableCellProps) => (
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
