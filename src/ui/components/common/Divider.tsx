import React from 'react';

import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

interface DividerProps {
    className?: string;
    fullWidth?: boolean;
}

export const Divider: React.FC<DividerProps> = ({ className, fullWidth }) => (
    <Box
        className={cn(
            'w-full py-[2px] flex items-center justify-center',
            !fullWidth && 'px-[12px]',
            className,
        )}
    >
        <Box className="w-full h-[3px] rounded-full bg-divider" />
    </Box>
);
