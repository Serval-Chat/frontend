import { useState } from 'react';

import { Plus } from 'lucide-react';

import type { Role } from '@/api/servers/servers.types';
import { RoleDot } from '@/features/servers/RoleDot';
import { Button } from '@/ui/primitives/Button';
import { IconButton } from '@/ui/primitives/IconButton';
import { Pressable } from '@/ui/primitives/Pressable';
import { Text } from '@/ui/primitives/Text';
import { cn } from '@/utils/cn';

export const RoleColorDot = ({ role }: { role?: Role }) => (
    <RoleDot className="h-3 w-3" role={role} size={12} />
);

interface RoleListItemProps {
    role: Role;
    isActive: boolean;
    onClick: () => void;
}

export const RoleListItem = ({
    role,
    isActive,
    onClick,
}: RoleListItemProps) => (
    <Button
        aria-current={isActive ? 'true' : undefined}
        className={cn(
            'w-full justify-start border-none px-3 py-2 text-sm shadow-none transition-all duration-200',
            isActive
                ? 'bg-bg-subtle font-semibold text-foreground'
                : 'bg-transparent text-muted-foreground hover:bg-bg-subtle hover:text-foreground focus:outline-none',
        )}
        variant="ghost"
        onClick={onClick}
    >
        <div className="flex items-center gap-2 truncate">
            <RoleColorDot role={role} />
            <Text className="truncate">{role.name}</Text>
        </div>
    </Button>
);

interface AddRoleDropdownProps {
    availableRoles: Role[];
    onAdd: (role: Role) => void;
}

export const AddRoleDropdown = ({
    availableRoles,
    onAdd,
}: AddRoleDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <IconButton
                icon={Plus}
                size="sm"
                title="Add Role Override"
                variant="ghost"
                onClick={(): void => {
                    setIsOpen((prev): boolean => !prev);
                }}
            />
            {isOpen ? (
                <>
                    <Pressable
                        aria-label="Close menu"
                        className="fixed inset-0 z-40 border-0 bg-transparent p-0"
                        tabIndex={-1}
                        onClick={(): void => {
                            setIsOpen(false);
                        }}
                        onKeyDown={(e): void => {
                            if (e.key === 'Escape' || e.key === 'Enter')
                                setIsOpen(false);
                        }}
                    />
                    <div className="absolute top-full right-0 z-50 mt-1 max-h-60 w-48 overflow-hidden rounded-md border border-border-subtle bg-background shadow-xl backdrop-blur-md">
                        <div className="h-full max-h-60 w-full overflow-y-auto bg-bg-secondary">
                            {availableRoles.length > 0 ? (
                                availableRoles.map((role) => (
                                    <Pressable
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-bg-subtle"
                                        key={role.id}
                                        onClick={(): void => {
                                            onAdd(role);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <RoleColorDot role={role} />
                                        <Text className="truncate">
                                            {role.name}
                                        </Text>
                                    </Pressable>
                                ))
                            ) : (
                                <Text
                                    as="p"
                                    className="px-3 py-2"
                                    size="sm"
                                    variant="muted"
                                >
                                    No roles left to add
                                </Text>
                            )}
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
};
