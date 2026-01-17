import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { Box } from '@/ui/components/layout/Box';
import type { StatusType } from '@/ui/types';
import { cn } from '@/utils/cn';

export interface StatusMessageProps {
    message: string;
    type: StatusType;
    className?: string;
}

/**
 * @description Status message component
 */
export const StatusMessage: React.FC<StatusMessageProps> = ({
    message,
    type,
    className,
}) => (
    <AnimatePresence mode="wait">
        {message && (
            <Box
                animate={{ opacity: 1, y: 0 }}
                as={motion.div}
                className={cn(
                    'w-full min-h-10 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-center border',
                    type === 'error'
                        ? 'bg-danger/10 text-danger border-danger/20'
                        : 'bg-success/10 text-success border-success/20',
                    className
                )}
                exit={{ opacity: 0, y: -10 }}
                initial={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
            >
                {message}
            </Box>
        )}
    </AnimatePresence>
);
