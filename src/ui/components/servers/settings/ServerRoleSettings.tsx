import { useState } from 'react';

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

export const ServerRoleSettings = ({ serverId }: ServerRoleSettingsProps) => {
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
        roles?.find((r): boolean => r.name === '@everyone')?.id ||
        roles?.[0]?.id ||
        null;

    const selectedRole = roles?.find(
        (r): boolean => r.id === effectiveSelectedId,
    );

    const handleAddRole = (): void => {
        createRoleMutation.mutate(
            {
                name: 'New Role',
                color: '#99aab5',
            },
            {
                onSuccess: (newRole): void => {
                    setSelectedRoleId(newRole.id);
                    setIsMobileListOpen(false);
                },
            },
        );
    };

    const handleDeleteRole = (roleId: string): void => {
        deleteRoleMutation.mutate(roleId, {
            onSuccess: (): void => {
                if (effectiveSelectedId === roleId) {
                    const everyone = roles?.find(
                        (r): boolean => r.name === '@everyone',
                    );
                    setSelectedRoleId(everyone?.id || null);
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
        const positions = newRoles.map(
            (r, i): { roleId: string; position: number } => ({
                roleId: r.id,
                position: newRoles.length - i,
            }),
        );
        reorderRolesMutation.mutate(positions);
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!roles || roles.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <Shield className="mb-4 text-muted-foreground" size={48} />
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
        <div className="flex h-full flex-col overflow-hidden md:flex-row">
            {/* Right Sidebar (Role List) - on mobile it should show when list is open */}
            <div
                className={cn(
                    'order-first h-full shrink-0 md:order-last',
                    isMobileListOpen ? 'w-full md:w-auto' : 'hidden md:block',
                )}
            >
                <RoleNavbar
                    roles={roles}
                    selectedRoleId={effectiveSelectedId}
                    onAddRole={handleAddRole}
                    onDeleteRole={handleDeleteRole}
                    onReorderRoles={handleReorderRoles}
                    onSelectRole={(id): void => {
                        setSelectedRoleId(id);
                        setIsMobileListOpen(false);
                    }}
                />
            </div>

            {/* Main Content (Editor) */}
            <div
                className={cn(
                    'relative flex-1 overflow-hidden',
                    isMobileListOpen ? 'hidden md:block' : 'block',
                )}
            >
                {/* Mobile Back Header */}
                {!isMobileListOpen && (
                    <div className="sticky top-0 z-20 mb-4 flex w-full shrink-0 items-center border-b border-border-subtle bg-background px-4 py-3 md:hidden">
                        <button
                            className="flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
                            type="button"
                            onClick={(): void => setIsMobileListOpen(true)}
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
                        key={selectedRole.id}
                        role={selectedRole}
                        onReset={(): void => {}}
                        onSave={handleSaveRole}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        Select a role to edit
                    </div>
                )}
            </div>
        </div>
    );
};
