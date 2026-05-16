import React from 'react';

import { NTScrollArea } from '@/ui/components/nt/NTScrollArea';
import { cn } from '@/utils/cn';

interface NTTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
    headers: string[];
    children: React.ReactNode;
}

export const NTTable: React.FC<NTTableProps> = ({
    headers,
    children,
    className,
    ...props
}) => (
    <NTScrollArea className="h-full w-full border border-[#dfdfdf] border-r-[#808080] border-b-[#808080] bg-white shadow-[inset_1px_1px_#808080,inset_-1px_-1px_#ffffff]">
        <table
            className={cn(
                'w-full table-fixed border-collapse text-left',
                className,
            )}
            {...props}
        >
            <thead>
                <tr className="bg-[#dfdfdf] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#808080]">
                    {headers.map((header) => (
                        <th
                            className="border border-[#808080] p-1 text-[10px] font-bold text-black"
                            key={header}
                        >
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>{children}</tbody>
        </table>
    </NTScrollArea>
);
