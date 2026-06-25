import { useState } from 'react';

import { Reorder, useDragControls } from 'framer-motion';
import { Copy, GripVertical, Plus, Trash2 } from 'lucide-react';

import type { Role } from '@/api/servers/servers.types';
import {
    ContextMenu,
    type ContextMenuItem,
} from '@/ui/components/common/ContextMenu';
import { IconButton } from '@/ui/components/common/IconButton';
import { RoleDot } from '@/ui/components/common/RoleDot';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { Text } from '@/ui/components/common/Text';
import { useToast } from '@/ui/components/common/Toast';
import { getRoleStyle } from '@/utils/roleColor';

interface RoleNavbarProps {
    roles: Role[];
    selectedRoleId: string | null;
    onSelectRole: (roleId: string) => void;
    onAddRole: () => void;
    onDeleteRole: (roleId: string) => void;
    onReorderRoles: (newRoles: Role[]) => void;
}

export const RoleNavbar = ({
    roles,
    selectedRoleId,
    onSelectRole,
    onAddRole,
    onDeleteRole,
    onReorderRoles,
}: RoleNavbarProps) => {
    const [localRoles, setLocalRoles] = useState((): Role[] =>
        roles.toSorted((a, b): number => b.position - a.position),
    );
    const [syncedRoles, setSyncedRoles] = useState(roles);

    if (roles !== syncedRoles) {
        setSyncedRoles(roles);
        setLocalRoles(
            roles.toSorted((a, b): number => b.position - a.position),
        );
    }

    const originalSorted = roles.toSorted(
        (a, b): number => b.position - a.position,
    );
    const hasOrderChanged = localRoles.some(
        (role, idx): boolean => role.id !== originalSorted[idx]?.id,
    );

    const handleSave = (): void => {
        const updated = localRoles.map((role, index) => ({
            ...role,
            position: localRoles.length - index,
        }));
        onReorderRoles(updated);
    };

    const handleReset = (): void => {
        setLocalRoles(
            roles.toSorted((a, b): number => b.position - a.position),
        );
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
                            isActive={selectedRoleId === role.id}
                            key={role.id}
                            role={role}
                            onDelete={(): void => onDeleteRole(role.id)}
                            onDragEnd={(): void => {}}
                            onSelect={(): void => onSelectRole(role.id)}
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

const RoleItem = ({
    role,
    isActive,
    onSelect,
    onDelete,
    onDragEnd,
}: RoleItemProps) => {
    const controls = useDragControls();
    const { showToast } = useToast();
    const isEveryone = role.name === '@everyone';
    const roleStyle = getRoleStyle(role);

    const handleCopyRoleId = (): void => {
        void navigator.clipboard.writeText(role.id);
        showToast('Role ID copied to clipboard', 'success');
    };

    const contextItems: ContextMenuItem[] = [
        {
            label: 'Copy Role ID',
            icon: Copy,
            onClick: handleCopyRoleId,
        },
    ];

    if (!isEveryone) {
        contextItems.push({
            label: 'Delete',
            icon: Trash2,
            onClick: onDelete,
        });
    }

    return (
        <ContextMenu className="w-full" items={contextItems}>
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
                    onPointerDown={(e): void => controls.start(e)}
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
            </Reorder.Item>
        </ContextMenu>
    );
};
