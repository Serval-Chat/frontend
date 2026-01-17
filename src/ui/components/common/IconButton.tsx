import React from 'react';

import { Button, type ButtonProps } from '@/ui/components/common/Button';
import { cn } from '@/utils/cn';

export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
    icon: React.ElementType;
    iconSize?: number;
    isActive?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
    icon: Icon,
    iconSize = 23,
    isActive,
    className,
    ...props
}) => {
    return (
        <Button
            variant="nav"
            className={cn(
                'rounded-xl hover:rounded-lg transition-all duration-200',
                className,
                isActive && 'bg-primary/20 text-primary'
            )}
            {...props}
        >
            <Icon size={iconSize} />
        </Button>
    );
};
