import React, { useState } from 'react';

import { Badge } from '@/ui/components/common/Badge';
import { Button, type ButtonProps } from '@/ui/components/common/Button';
import { colors } from '@/ui/theme';

export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
    icon: React.ElementType;
    iconSize?: number;
    isActive?: boolean;
    badgeCount?: number;
}

export const IconButton = ({
    icon: Icon,
    iconSize = 23,
    isActive,
    badgeCount,
    variant,
    style,
    ...props
}: IconButtonProps) => {
    const [hovered, setHovered] = useState(false);

    return (
        <Button
            style={{
                ...(isActive
                    ? {
                          backgroundColor: `color-mix(in srgb, ${colors.primary} 20%, transparent)`,
                          color: colors.primary,
                      }
                    : {}),
                ...(hovered && isActive
                    ? {
                          backgroundColor: `color-mix(in srgb, ${colors.primary} 30%, transparent)`,
                      }
                    : {}),
                ...style,
            }}
            variant={variant ?? 'nav'}
            onMouseEnter={() => {
                setHovered(true);
            }}
            onMouseLeave={() => {
                setHovered(false);
            }}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
        >
            <Icon size={iconSize} />
            {badgeCount !== undefined && badgeCount > 0 ? (
                <Badge count={badgeCount} />
            ) : null}
        </Button>
    );
};
