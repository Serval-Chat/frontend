import React from 'react';

import { Check, ChevronRight, Plus } from 'lucide-react';

import type { Role } from '@/api/servers/servers.types';
import { RoleDot } from '@/features/servers/RoleDot';
import { Box } from '@/ui/primitives/Box';
import { Popover } from '@/ui/primitives/Popover';
import { Pressable } from '@/ui/primitives/Pressable';
import { Text } from '@/ui/primitives/Text';
import { cn } from '@/utils/cn';

export const RoleSelector = ({
    allRoles,
    userRoles,
    isOwner,
    myHighestRolePosition,
    onAddRole,
    onRemoveRole,
}: {
    allRoles: Role[];
    userRoles?: Role[];
    isOwner: boolean;
    myHighestRolePosition?: number;
    onAddRole: (roleId: string) => void;
    onRemoveRole: (roleId: string) => void;
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [popoverOpensLeft, setPopoverOpensLeft] = React.useState(false);
    const triggerRef = React.useRef<HTMLButtonElement>(null);

    const rolesToDisplay = allRoles.filter(
        (r): boolean => r.name !== '@everyone',
    );
    rolesToDisplay.sort((a, b): number => b.position - a.position);

    return (
        <>
            <Pressable
                aria-expanded={isOpen}
                className="flex h-5 w-5 cursor-pointer items-center justify-center"
                ref={triggerRef}
                title="Add Role"
                onClick={(): void => {
                    if (!isOpen) {
                        const triggerRect =
                            triggerRef.current?.getBoundingClientRect();
                        setPopoverOpensLeft(
                            !!triggerRect &&
                                triggerRect.right + 12 + 192 >
                                    window.innerWidth,
                        );
                    }
                    setIsOpen((open) => !open);
                }}
            >
                {isOpen ? (
                    <ChevronRight
                        className={popoverOpensLeft ? 'rotate-180' : 'rotate-0'}
                        size={16}
                    />
                ) : (
                    <Plus size={16} />
                )}
            </Pressable>

            <Popover
                className="z-[var(--z-index-profile-menu)] w-48 p-1"
                isOpen={isOpen}
                triggerRef={triggerRef}
                onClose={(): void => {
                    setIsOpen(false);
                }}
            >
                <Box className="flex flex-col gap-0.5">
                    {rolesToDisplay.length > 0 ? (
                        rolesToDisplay.map((role) => {
                            const hasRole = userRoles?.some(
                                (ur): boolean => ur.id === role.id,
                            );
                            const canManageThisRole =
                                isOwner ||
                                (myHighestRolePosition !== undefined &&
                                    myHighestRolePosition > role.position);

                            return (
                                <Pressable
                                    className={cn(
                                        'flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors',
                                        canManageThisRole
                                            ? 'cursor-pointer hover:bg-bg-secondary'
                                            : 'cursor-not-allowed opacity-50',
                                    )}
                                    disabled={!canManageThisRole}
                                    key={role.id}
                                    onClick={(): void => {
                                        if (hasRole) {
                                            onRemoveRole(role.id);
                                        } else {
                                            onAddRole(role.id);
                                        }
                                    }}
                                >
                                    <Box className="flex items-center gap-2 truncate">
                                        <RoleDot role={role} size={8} />
                                        <Text className="truncate">
                                            {role.name}
                                        </Text>
                                    </Box>
                                    {hasRole ? (
                                        <Check
                                            className="text-primary"
                                            size={14}
                                        />
                                    ) : null}
                                </Pressable>
                            );
                        })
                    ) : (
                        <Box className="px-2 py-1.5 text-xs text-muted-foreground">
                            No roles available
                        </Box>
                    )}
                </Box>
            </Popover>
        </>
    );
};
