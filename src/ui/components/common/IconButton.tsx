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
            className={cn(className, isActive && 'bg-white/10 text-white')}
            {...props}
        >
            <Icon size={iconSize} />
        </Button>
    );
};
