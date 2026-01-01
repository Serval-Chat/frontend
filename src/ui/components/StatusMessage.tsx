import React from 'react';
import { cn } from '@/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import type { StatusType } from '@/ui/types';

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
}) => {
    return (
        <AnimatePresence mode="wait">
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                        'w-full min-h-10 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-center border',
                        type === 'error'
                            ? 'bg-danger/10 text-danger border-danger/20'
                            : 'bg-success/10 text-success border-success/20',
                        className
                    )}
                >
                    {message}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
