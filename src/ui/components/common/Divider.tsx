import React from 'react';

import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

interface DividerProps {
    className?: string;
}

export const Divider: React.FC<DividerProps> = ({ className }) => (
    <Box
        className={cn(
            'w-full px-[12px] py-[2px] flex items-center justify-center',
            className
        )}
    >
        <Box className="w-full h-[3px] rounded-full bg-divider" />
    </Box>
);
