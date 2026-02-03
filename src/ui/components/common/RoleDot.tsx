import React from 'react';

import type { Role } from '@/api/servers/servers.types';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';
import { getRoleStyle } from '@/utils/roleColor';

interface RoleDotProps {
    role?: Role;
    className?: string;
    size?: number | string;
}

/**
 * @description Renders a small dot with the role's color(s).
 */
export const RoleDot: React.FC<RoleDotProps> = ({
    role,
    className,
    size = 12,
}) => {
    const style = getRoleStyle(role);

    return (
        <Box
            className={cn('rounded-full shrink-0', className)}
            style={{
                ...style,
                width: size,
                height: size,
            }}
        />
    );
};
