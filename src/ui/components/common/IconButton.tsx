import React from 'react';

import { Badge } from '@/ui/components/common/Badge';
import { Button, type ButtonProps } from '@/ui/components/common/Button';
import { cn } from '@/utils/cn';

export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
    icon: React.ElementType;
    iconSize?: number;
    isActive?: boolean;
    badgeCount?: number;
}

export const IconButton: React.FC<IconButtonProps> = ({
    icon: Icon,
    iconSize = 23,
    isActive,
    badgeCount,
    className,
    ...props
}) => (
    <Button
        className={cn(
            'rounded-xl hover:rounded-lg transition-all duration-200 relative',
            className,
            isActive && 'bg-primary/20 text-primary',
        )}
        variant="nav"
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
    >
        <Icon size={iconSize} />
        {badgeCount !== undefined && badgeCount > 0 && (
            <Badge count={badgeCount} />
        )}
    </Button>
);
