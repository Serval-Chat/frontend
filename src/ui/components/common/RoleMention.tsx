import React from 'react';

import { useRoles } from '@/api/servers/servers.queries';
import { useAppSelector } from '@/store/hooks';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';

interface RoleMentionProps {
    roleId: string;
}

/**
 * @description Renders a role mention with its specific colors.
 */
export const RoleMention: React.FC<RoleMentionProps> = ({ roleId }) => {
    const selectedServerId = useAppSelector(
        (state) => state.nav.selectedServerId,
    );
    const { data: roles, isLoading } = useRoles(selectedServerId);

    const role = roles?.find((r) => r._id === roleId);

    const roleName = role ? role.name : isLoading ? '...' : 'unknown-role';

    const style: React.CSSProperties = {};
    if (role) {
        if (role.colors && role.colors.length >= 2) {
            const repeat =
                role.gradientRepeat && role.gradientRepeat > 1
                    ? role.gradientRepeat
                    : 1;
            if (repeat > 1) {
                const stop = (100 / repeat).toFixed(2);
                style.background = `repeating-linear-gradient(90deg, ${role.colors.join(
                    ', ',
                )} ${stop}%)`;
            } else {
                style.background = `linear-gradient(90deg, ${role.colors.join(
                    ', ',
                )})`;
            }
        } else if (role.color) {
            style.backgroundColor = role.color;
        } else {
            style.backgroundColor = 'var(--primary)';
        }
    } else {
        style.backgroundColor = 'var(--divider)';
    }

    return (
        <Box
            as="span"
            className="inline-flex items-baseline px-1.5 py-[4px] rounded transition-opacity cursor-pointer select-none font-medium text-white shadow-sm hover:opacity-90"
            style={style}
        >
            <Text as="span" className="leading-none drop-shadow-md" size="sm">
                @{roleName}
            </Text>
        </Box>
    );
};
