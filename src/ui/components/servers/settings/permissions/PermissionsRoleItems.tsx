import React, { useState } from 'react';

import { Plus } from 'lucide-react';

import type { Role } from '@/api/servers/servers.types';
import { Button } from '@/ui/components/common/Button';
import { IconButton } from '@/ui/components/common/IconButton';
import { RoleDot } from '@/ui/components/common/RoleDot';
import { cn } from '@/utils/cn';

export const RoleColorDot: React.FC<{ role?: Role }> = ({ role }) => (
    <RoleDot className="h-3 w-3" role={role} size={12} />
);

interface RoleListItemProps {
    role: Role;
    isActive: boolean;
    onClick: () => void;
}

export const RoleListItem: React.FC<RoleListItemProps> = ({
    role,
    isActive,
    onClick,
}) => (
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
            <span className="truncate">{role.name}</span>
        </div>
    </Button>
);

interface AddRoleDropdownProps {
    availableRoles: Role[];
    onAdd: (role: Role) => void;
}

export const AddRoleDropdown: React.FC<AddRoleDropdownProps> = ({
    availableRoles,
    onAdd,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <IconButton
                icon={Plus}
                size="sm"
                title="Add Role Override"
                variant="ghost"
                onClick={() => setIsOpen((prev) => !prev)}
            />
            {isOpen && (
                <>
                    <div
                        aria-label="Close menu"
                        className="fixed inset-0 z-40"
                        role="button"
                        tabIndex={-1}
                        onClick={() => setIsOpen(false)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape' || e.key === 'Enter')
                                setIsOpen(false);
                        }}
                    />
                    <div className="absolute top-full right-0 z-50 mt-1 max-h-60 w-48 overflow-hidden rounded-md border border-border-subtle bg-background shadow-xl backdrop-blur-md">
                        <div className="h-full max-h-60 w-full overflow-y-auto bg-bg-secondary">
                            {availableRoles.length > 0 ? (
                                availableRoles.map((role) => (
                                    <button
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-bg-subtle"
                                        key={role._id}
                                        onClick={() => {
                                            onAdd(role);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <RoleColorDot role={role} />
                                        <span className="truncate">
                                            {role.name}
                                        </span>
                                    </button>
                                ))
                            ) : (
                                <p className="px-3 py-2 text-sm text-muted-foreground">
                                    No roles left to add
                                </p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
