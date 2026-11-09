import React from 'react';

import { X } from 'lucide-react';

import type { Role } from '@/api/servers/servers.types';
import { RoleDot } from '@/features/servers/RoleDot';
import { Box } from '@/ui/primitives/Box';
import { Heading } from '@/ui/primitives/Heading';
import { Pressable } from '@/ui/primitives/Pressable';
import { Text } from '@/ui/primitives/Text';
import { Tooltip } from '@/ui/primitives/Tooltip';
import { cn } from '@/utils/cn';

import { RoleSelector } from './RoleSelector';

export const ProfileCardRoles = ({
    roles,
    canManageRoles,
    allServerRoles,
    serverId,
    userId,
    isOwner,
    myHighestRolePosition,
    onAddRole,
    onRemoveRole,
}: {
    roles?: Role[];
    canManageRoles?: boolean;
    allServerRoles?: Role[];
    serverId?: string;
    userId?: string;
    isOwner?: boolean;
    myHighestRolePosition?: number;
    onAddRole: (roleId: string) => void;
    onRemoveRole: (roleId: string) => void;
}): React.ReactNode => {
    if (!((roles && roles.length > 0) || (canManageRoles && allServerRoles))) {
        return null;
    }

    return (
        <Box className="mb-4">
            <Box className="mb-2 flex items-center justify-between">
                <Heading
                    className="text-xs font-bold text-muted-foreground uppercase"
                    level={3}
                >
                    Roles
                </Heading>
                {canManageRoles && allServerRoles && serverId && userId ? (
                    <Box className="relative">
                        <RoleSelector
                            allRoles={allServerRoles}
                            isOwner={!!isOwner}
                            myHighestRolePosition={myHighestRolePosition}
                            userRoles={roles}
                            onAddRole={onAddRole}
                            onRemoveRole={onRemoveRole}
                        />
                    </Box>
                ) : null}
            </Box>
            <Box className="flex flex-wrap gap-2">
                {roles
                    ?.slice()
                    .sort((a, b): number => b.position - a.position)
                    .map((r) => {
                        const canManageThisRole =
                            isOwner ||
                            (myHighestRolePosition !== undefined &&
                                myHighestRolePosition > r.position);

                        const pill = (
                            <Box
                                className={cn(
                                    'group flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-secondary px-2 py-1 transition-all',
                                    canManageRoles &&
                                        canManageThisRole &&
                                        'hover:border-danger/30 hover:bg-danger/5',
                                )}
                                key={r.id}
                            >
                                <RoleDot role={r} />
                                <Text
                                    as="span"
                                    className="text-xs font-medium text-foreground/90"
                                >
                                    {r.name}
                                </Text>
                                {canManageRoles &&
                                canManageThisRole &&
                                userId ? (
                                    <Pressable
                                        className="ml-0.5 hidden text-muted-foreground group-hover:block hover:text-danger"
                                        title="Remove Role"
                                        onClick={(): void => {
                                            onRemoveRole(r.id);
                                        }}
                                    >
                                        <X size={12} />
                                    </Pressable>
                                ) : null}
                            </Box>
                        );

                        return r.description ? (
                            <Tooltip
                                className="z-[var(--z-index-tooltip)] max-w-[200px] font-normal whitespace-normal"
                                content={r.description}
                                key={r.id}
                                position="top"
                            >
                                {pill}
                            </Tooltip>
                        ) : (
                            <React.Fragment key={r.id}>{pill}</React.Fragment>
                        );
                    })}
            </Box>
        </Box>
    );
};
