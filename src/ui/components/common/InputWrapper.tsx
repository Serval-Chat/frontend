import React from 'react';

import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

interface InputWrapperProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * @description Input wrapper for inputs for consistent vertical spacing
 */
export const InputWrapper: React.FC<InputWrapperProps> = ({
    children,
    className,
}) => <Box className={cn('space-y-xs', className)}>{children}</Box>;
