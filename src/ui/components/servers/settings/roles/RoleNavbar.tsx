import React, { useState } from 'react';

import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Plus, Trash2 } from 'lucide-react';

import type { Role } from '@/api/servers/servers.types';
import { IconButton } from '@/ui/components/common/IconButton';
import { RoleDot } from '@/ui/components/common/RoleDot';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
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

    const originalSorted = [...roles].sort((a, b) => b.position - a.position);
    const hasOrderChanged = localRoles.some(
        (role, idx) => role._id !== originalSorted[idx]?._id,
    );

    const handleSave = (): void => {
        const updated = localRoles.map((role, index) => ({
            ...role,
            position: localRoles.length - index,
        }));
        onReorderRoles(updated);
    };

    const handleReset = (): void => {
        setLocalRoles([...roles].sort((a, b) => b.position - a.position));
    };

    return (
        <div className="flex h-full w-full shrink-0 flex-col overflow-hidden border-l border-border-subtle bg-bg-subtle md:w-64">
            <div className="flex items-center justify-between border-b border-border-subtle p-3">
                <Text size="sm" weight="bold">
                    Roles
                </Text>
                <IconButton
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
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
                            onDragEnd={() => {}}
                            onSelect={() => onSelectRole(role._id)}
                        />
                    ))}
                </Reorder.Group>
            </div>
            <SettingsFloatingBar
                isFixed
                isVisible={hasOrderChanged}
                message="Careful - you have unsaved role order changes!"
                offset="0px"
                onReset={handleReset}
                onSave={handleSave}
            />
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
            className={`group flex cursor-pointer items-center gap-1.5 rounded p-1 transition-colors
                ${isActive ? 'bg-bg-secondary text-foreground' : 'text-muted-foreground hover:bg-bg-subtle hover:text-foreground'}
            `}
            dragControls={controls}
            dragListener={false}
            value={role}
            onClick={onSelect}
            onDragEnd={onDragEnd}
        >
            <div
                className="cursor-grab p-0.5 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
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
                    className="h-6 w-6 p-0 text-danger opacity-0 transition-opacity group-hover:opacity-100 hover:bg-danger-muted"
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
