import React from 'react';

import { Text } from '@/ui/components/common/Text';
import { cn } from '@/utils/cn';

interface MutedTextProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * @description muted text component
 */
export const MutedText: React.FC<MutedTextProps> = ({
    children,
    className,
}) => (
    <Text as="p" className={cn('text-sm text-muted-foreground/80', className)}>
        {children}
    </Text>
);
