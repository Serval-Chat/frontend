import React, { useState } from 'react';

import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Plus, Trash2 } from 'lucide-react';

import type { Role } from '@/api/servers/servers.types';
import { IconButton } from '@/ui/components/common/IconButton';
import { RoleDot } from '@/ui/components/common/RoleDot';
import { Text } from '@/ui/components/common/Text';
import { getRoleStyle } from '@/utils/roleColor';

interface RoleNavbarProps {
    roles: Role[];
    selectedRoleId: string | null;
    onSelectRole: (roleId: string) => void;
    onAddRole: () => void;
    onDeleteRole: (roleId: string) => void;
    onReorderRoles: (newRoles: Role[]) => void;
}

export const RoleNavbar: React.FC<RoleNavbarProps> = ({
    roles,
    selectedRoleId,
    onSelectRole,
    onAddRole,
    onDeleteRole,
    onReorderRoles,
}) => {
    // Roles are usually sorted by position in descending order (highest role first)
    const [localRoles, setLocalRoles] = useState(() =>
        [...roles].sort((a, b) => b.position - a.position),
    );
    const [prevRoles, setPrevRoles] = useState(roles);

    if (roles !== prevRoles) {
        setLocalRoles([...roles].sort((a, b) => b.position - a.position));
        setPrevRoles(roles);
    }

    const handleDragEnd = (): void => {
        const updated = localRoles.map((role, index) => ({
            ...role,
            position: localRoles.length - index,
        }));
        onReorderRoles(updated);
    };

    return (
        <div className="w-64 bg-[var(--color-bg-subtle)] border-l border-[var(--color-border-subtle)] flex flex-col h-full overflow-hidden shrink-0">
            <div className="p-3 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
                <Text size="sm" weight="bold">
                    Roles
                </Text>
                <IconButton
                    className="w-7 h-7 p-0 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                    icon={Plus}
                    iconSize={16}
                    title="Add Role"
                    variant="ghost"
                    onClick={onAddRole}
                />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                <Reorder.Group
                    axis="y"
                    className="flex flex-col gap-1"
                    values={localRoles}
                    onReorder={setLocalRoles}
                >
                    {localRoles.map((role) => (
                        <RoleItem
                            isActive={selectedRoleId === role._id}
                            key={role._id}
                            role={role}
                            onDelete={() => onDeleteRole(role._id)}
                            onDragEnd={handleDragEnd}
                            onSelect={() => onSelectRole(role._id)}
                        />
                    ))}
                </Reorder.Group>
            </div>
        </div>
    );
};

interface RoleItemProps {
    role: Role;
    isActive: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onDragEnd: () => void;
}

const RoleItem: React.FC<RoleItemProps> = ({
    role,
    isActive,
    onSelect,
    onDelete,
    onDragEnd,
}) => {
    const controls = useDragControls();
    const isEveryone = role.name === '@everyone';
    const roleStyle = getRoleStyle(role);

    return (
        <Reorder.Item
            className={`group flex items-center gap-1.5 p-1 rounded transition-colors cursor-pointer
                ${isActive ? 'bg-[var(--color-bg-secondary)] text-[var(--color-foreground)]' : 'hover:bg-[var(--color-bg-subtle)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'}
            `}
            dragControls={controls}
            dragListener={false}
            value={role}
            onClick={onSelect}
            onDragEnd={onDragEnd}
        >
            <div
                className="cursor-grab active:cursor-grabbing p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                onPointerDown={(e) => controls.start(e)}
            >
                <GripVertical size={12} />
            </div>

            <RoleDot role={role} size={8} />

            <Text
                className="flex-1 truncate text-[13px]"
                style={{
                    color:
                        roleStyle.backgroundColor ||
                        roleStyle.color ||
                        undefined,
                }}
            >
                {role.name}
            </Text>

            {!isEveryone && (
                <IconButton
                    className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)] transition-opacity"
                    icon={Trash2}
                    iconSize={12}
                    variant="ghost"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                />
            )}
        </Reorder.Item>
    );
};
