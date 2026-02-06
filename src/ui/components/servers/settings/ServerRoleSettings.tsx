import React, { useState } from 'react';

import { Shield } from 'lucide-react';

import {
    useCreateRole,
    useDeleteRole,
    useReorderRoles,
    useRoles,
    useUpdateRole,
} from '@/api/servers/servers.queries';
import type { Role, RolePermissions } from '@/api/servers/servers.types';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Text } from '@/ui/components/common/Text';

import { RoleEditor } from './roles/RoleEditor';
import { RoleNavbar } from './roles/RoleNavbar';

interface ServerRoleSettingsProps {
    serverId: string;
}

export const ServerRoleSettings: React.FC<ServerRoleSettingsProps> = ({
    serverId,
}) => {
    const { data: roles, isLoading } = useRoles(serverId);
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

    const createRoleMutation = useCreateRole(serverId);
    const updateRoleMutation = useUpdateRole(serverId, selectedRoleId || '');
    const deleteRoleMutation = useDeleteRole(serverId);
    const reorderRolesMutation = useReorderRoles(serverId);

    const effectiveSelectedId =
        selectedRoleId ||
        roles?.find((r) => r.name === '@everyone')?._id ||
        roles?.[0]?._id ||
        null;

    const selectedRole = roles?.find((r) => r._id === effectiveSelectedId);

    const handleAddRole = (): void => {
        createRoleMutation.mutate(
            {
                name: 'New Role',
                color: '#99aab5',
            },
            {
                onSuccess: (newRole) => {
                    setSelectedRoleId(newRole._id);
                },
            },
        );
    };

    const handleDeleteRole = (roleId: string): void => {
        deleteRoleMutation.mutate(roleId, {
            onSuccess: () => {
                if (effectiveSelectedId === roleId) {
                    const everyone = roles?.find((r) => r.name === '@everyone');
                    setSelectedRoleId(everyone?._id || null);
                }
            },
        });
    };

    const handleSaveRole = (
        updates: Partial<Role> & { permissions?: RolePermissions },
    ): void => {
        if (!effectiveSelectedId) return;
        updateRoleMutation.mutate(updates);
    };

    const handleReorderRoles = (newRoles: Role[]): void => {
        const positions = newRoles.map((r, i) => ({
            roleId: r._id,
            position: newRoles.length - i,
        }));
        reorderRolesMutation.mutate(positions);
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!roles || roles.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <Shield
                    className="text-[var(--color-muted-foreground)] mb-4"
                    size={48}
                />
                <Text className="mb-2" size="lg" weight="bold">
                    Something went wrong
                </Text>
                <Text variant="muted">
                    Could not load roles for this server.
                </Text>
            </div>
        );
    }

    return (
        <div className="h-full flex overflow-hidden">
            {/* Main Content (Editor) */}
            <div className="flex-1 overflow-hidden relative">
                {selectedRole ? (
                    <RoleEditor
                        key={selectedRole._id}
                        role={selectedRole}
                        onReset={() => {}}
                        onSave={handleSaveRole}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-[var(--color-muted-foreground)]">
                        Select a role to edit
                    </div>
                )}
            </div>

            {/* Right Sidebar (Role List) */}
            <RoleNavbar
                roles={roles}
                selectedRoleId={effectiveSelectedId}
                onAddRole={handleAddRole}
                onDeleteRole={handleDeleteRole}
                onReorderRoles={handleReorderRoles}
                onSelectRole={setSelectedRoleId}
            />
        </div>
    );
};
