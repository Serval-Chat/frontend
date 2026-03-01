import React, { useState } from 'react';

import { Plus } from 'lucide-react';

import type { Role } from '@/api/servers/servers.types';
import { Button } from '@/ui/components/common/Button';
import { IconButton } from '@/ui/components/common/IconButton';
import { cn } from '@/utils/cn';

export const RoleColorDot: React.FC<{ color?: string | null }> = ({
    color,
}) => (
    <div
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: color || '#99aab5' }}
    />
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
            'justify-start w-full px-3 py-2 text-sm transition-all duration-200 shadow-none border-none',
            isActive
                ? 'bg-[var(--color-bg-subtle)] text-[var(--color-foreground)] font-semibold'
                : 'bg-transparent text-[var(--color-muted-foreground)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-foreground)] focus:outline-none',
        )}
        variant="ghost"
        onClick={onClick}
    >
        <div className="flex items-center gap-2 truncate">
            <RoleColorDot color={role.color} />
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
                    <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                        {availableRoles.length > 0 ? (
                            availableRoles.map((role) => (
                                <button
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-bg-subtle)] text-[var(--color-foreground)] flex items-center gap-2"
                                    key={role._id}
                                    onClick={() => {
                                        onAdd(role);
                                        setIsOpen(false);
                                    }}
                                >
                                    <RoleColorDot color={role.color} />
                                    <span className="truncate">
                                        {role.name}
                                    </span>
                                </button>
                            ))
                        ) : (
                            <p className="px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
                                No roles left to add
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
