import React from 'react';

import { useRoles } from '@/api/servers/servers.queries';
import { useAppSelector } from '@/store/hooks';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { getRoleStyle } from '@/utils/roleColor';

interface RoleMentionProps {
    roleId: string;
}

/**
 * @description Renders a role mention with colorrss
 */
export const RoleMention: React.FC<RoleMentionProps> = ({ roleId }) => {
    const selectedServerId = useAppSelector(
        (state) => state.nav.selectedServerId,
    );
    const { data: roles, isLoading } = useRoles(selectedServerId);

    const role = roles?.find((r) => r._id === roleId);

    const roleName = role ? role.name : isLoading ? '...' : 'unknown-role';

    const style = getRoleStyle(role);

    return (
        <Box
            as="span"
            className="inline-flex items-baseline px-1.5 py-[4px] rounded transition-opacity cursor-pointer select-none font-medium text-white shadow-sm hover:opacity-90"
            style={style}
        >
            <Text as="span" className="leading-none drop-shadow-md" size="sm">
                {roleName.startsWith('@') ? roleName : `@${roleName}`}
            </Text>
        </Box>
    );
};
