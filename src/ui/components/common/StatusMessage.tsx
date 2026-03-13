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
                    'flex min-h-10 w-full items-center justify-center rounded-md border px-4 py-2 text-center text-sm font-medium',
                    type === 'error'
                        ? 'border-danger/20 bg-danger/10 text-danger'
                        : 'border-success/20 bg-success/10 text-success',
                    className,
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
