import React, { useState } from 'react';

import { ChevronLeft, Shield } from 'lucide-react';

import {
    useCreateRole,
    useDeleteRole,
    useReorderRoles,
    useRoles,
    useServerDetails,
    useUpdateRole,
} from '@/api/servers/servers.queries';
import type { Role, RolePermissions } from '@/api/servers/servers.types';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Text } from '@/ui/components/common/Text';
import { cn } from '@/utils/cn';

import { RoleEditor } from './roles/RoleEditor';
import { RoleNavbar } from './roles/RoleNavbar';

interface ServerRoleSettingsProps {
    serverId: string;
}

export const ServerRoleSettings: React.FC<ServerRoleSettingsProps> = ({
    serverId,
}) => {
    const { data: server } = useServerDetails(serverId);
    const { data: roles, isLoading } = useRoles(serverId);
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [isMobileListOpen, setIsMobileListOpen] = useState(true);

    const createRoleMutation = useCreateRole(serverId);
    const updateRoleMutation = useUpdateRole(serverId);
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
                    setIsMobileListOpen(false);
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
        updateRoleMutation.mutate({ roleId: effectiveSelectedId, updates });
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
        <div className="h-full flex flex-col md:flex-row overflow-hidden">
            {/* Right Sidebar (Role List) - on mobile it should show when list is open */}
            <div
                className={cn(
                    'h-full shrink-0 order-first md:order-last',
                    isMobileListOpen ? 'w-full md:w-auto' : 'hidden md:block',
                )}
            >
                <RoleNavbar
                    roles={roles}
                    selectedRoleId={effectiveSelectedId}
                    onAddRole={handleAddRole}
                    onDeleteRole={handleDeleteRole}
                    onReorderRoles={handleReorderRoles}
                    onSelectRole={(id) => {
                        setSelectedRoleId(id);
                        setIsMobileListOpen(false);
                    }}
                />
            </div>

            {/* Main Content (Editor) */}
            <div
                className={cn(
                    'flex-1 overflow-hidden relative',
                    isMobileListOpen ? 'hidden md:block' : 'block',
                )}
            >
                {/* Mobile Back Header */}
                {!isMobileListOpen && (
                    <div className="md:hidden items-center flex sticky top-0 z-20 bg-[var(--color-background)] border-b border-[var(--color-border-subtle)] px-4 py-3 shrink-0 w-full mb-4">
                        <button
                            className="flex items-center gap-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] font-medium transition-colors"
                            onClick={() => setIsMobileListOpen(true)}
                        >
                            <ChevronLeft size={20} />
                            Back
                        </button>
                    </div>
                )}
                {selectedRole ? (
                    <RoleEditor
                        disableCustomFonts={server?.disableCustomFonts}
                        disableGlowAndColors={
                            server?.disableUsernameGlowAndCustomColor
                        }
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
        </div>
    );
};
