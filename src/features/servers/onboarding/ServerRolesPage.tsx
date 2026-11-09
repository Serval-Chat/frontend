import { useState } from 'react';

import { CheckCircle2, Tag } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import {
    useOnboarding,
    useRoles,
    useUpdateSelfRoles,
} from '@/api/servers/servers.queries';
import type { Role } from '@/api/servers/servers.types';
import { RoleDot } from '@/features/servers/RoleDot';
import { ServerSubpageLayout } from '@/features/servers/ServerSubpageLayout';
import { LoadingSpinner } from '@/ui/primitives/LoadingSpinner';
import { Pressable } from '@/ui/primitives/Pressable';
import { SettingsFloatingBar } from '@/ui/primitives/SettingsFloatingBar';
import { Text } from '@/ui/primitives/Text';
import { cn } from '@/utils/cn';

const sortByPosition = <T extends { position: number }>(items: T[]): T[] =>
    [...items].sort((a, b): number => a.position - b.position);

const RoleAssignRow = ({
    role,
    isSelected,
    onToggle,
}: {
    role: Role;
    isSelected: boolean;
    onToggle: () => void;
}) => (
    <Pressable
        aria-pressed={isSelected}
        className={cn(
            'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
            isSelected ? 'bg-primary/10' : 'hover:bg-white/5',
        )}
        onClick={onToggle}
    >
        <RoleDot role={role} size={10} />
        <div className="min-w-0 flex-1">
            <div
                className={cn(
                    'truncate text-sm font-medium',
                    isSelected ? 'text-primary' : 'text-foreground',
                )}
            >
                {role.name}
            </div>
            {role.description ? (
                <div className="truncate text-xs text-muted-foreground">
                    {role.description}
                </div>
            ) : null}
        </div>
        {isSelected ? (
            <CheckCircle2 className="shrink-0 text-primary" size={18} />
        ) : (
            <div className="h-[18px] w-[18px] shrink-0 rounded-full border border-border-subtle" />
        )}
    </Pressable>
);

const RoleAssignList = ({
    roles,
    allowedRoleIds,
    selectedRoleIds,
    onChange,
}: {
    roles: Role[];
    allowedRoleIds: string[];
    selectedRoleIds: string[];
    onChange: (roleIds: string[]) => void;
}) => {
    const allowed = new Set(allowedRoleIds);
    const selected = new Set(selectedRoleIds);
    const availableRoles = sortByPosition(
        roles.filter((role): boolean => allowed.has(role.id)),
    );

    if (availableRoles.length === 0) {
        return (
            <Text as="p" size="sm" variant="muted">
                This server has not configured any self-assignable roles.
            </Text>
        );
    }

    const toggleRole = (roleId: string): void => {
        const next = new Set(selected);
        if (next.has(roleId)) {
            next.delete(roleId);
        } else {
            next.add(roleId);
        }
        onChange([...next].filter((id): boolean => allowed.has(id)));
    };

    return (
        <div className="divide-y divide-border-subtle overflow-hidden rounded-lg border border-border-subtle">
            {availableRoles.map((role) => (
                <RoleAssignRow
                    isSelected={selected.has(role.id)}
                    key={role.id}
                    role={role}
                    onToggle={(): void => {
                        toggleRole(role.id);
                    }}
                />
            ))}
        </div>
    );
};

export const ServerRolesPage = () => {
    const { serverId } = useParams<{ serverId: string }>();
    const navigate = useNavigate();
    const { data: onboarding } = useOnboarding(serverId ?? '');
    const { data: roles } = useRoles(serverId ?? '');
    const updateSelfRoles = useUpdateSelfRoles(serverId ?? '');
    const allowedRoleIds = onboarding?.onboarding.selfAssignableRoleIds ?? [];
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [syncedOnboarding, setSyncedOnboarding] =
        useState<typeof onboarding>(undefined);

    if (onboarding !== syncedOnboarding) {
        setSyncedOnboarding(onboarding);
        if (onboarding) {
            const allowed = new Set(
                onboarding.onboarding.selfAssignableRoleIds,
            );
            setSelectedRoleIds(
                onboarding.member.roles.filter((roleId): boolean =>
                    allowed.has(roleId),
                ),
            );
        }
    }

    const handleSave = (): void => {
        if (!serverId) return;
        updateSelfRoles.mutate(selectedRoleIds, {
            onSuccess: (): void => {
                setHasUnsavedChanges(false);
            },
        });
    };

    const handleChange = (newRoleIds: string[]): void => {
        setSelectedRoleIds(newRoleIds);
        setHasUnsavedChanges(true);
    };

    const handleBack = (): void => {
        void navigate(`/chat/@server/${serverId}`);
    };

    if (!serverId) return null;

    return (
        <ServerSubpageLayout
            footer={
                <SettingsFloatingBar
                    containerClassName="pride-glass-input"
                    isPending={updateSelfRoles.isPending}
                    isVisible={hasUnsavedChanges}
                    offset="0px"
                    onReset={(): void => {
                        if (onboarding) {
                            const allowed = new Set(
                                onboarding.onboarding.selfAssignableRoleIds,
                            );
                            setSelectedRoleIds(
                                onboarding.member.roles.filter(
                                    (roleId): boolean => allowed.has(roleId),
                                ),
                            );
                        }
                        setHasUnsavedChanges(false);
                    }}
                    onSave={handleSave}
                />
            }
            reserveFooterSpace={hasUnsavedChanges}
        >
            {!onboarding || !roles ? (
                <div className="flex min-h-40 items-center justify-center">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="max-w-3xl space-y-6">
                    <Pressable
                        aria-label="Back to server"
                        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground md:hidden"
                        onClick={handleBack}
                    >
                        ← Back
                    </Pressable>
                    <div className="flex items-center gap-3">
                        <Tag className="h-6 w-6 shrink-0 text-muted-foreground" />
                        <div className="flex min-w-0 flex-1 flex-col">
                            <Text
                                className="leading-6"
                                size="xl"
                                variant="default"
                                weight="semibold"
                            >
                                Self-assignable roles
                            </Text>
                            <Text size="sm" variant="muted">
                                Pick the roles you want in this server.
                            </Text>
                        </div>
                    </div>
                    <RoleAssignList
                        allowedRoleIds={allowedRoleIds}
                        roles={roles}
                        selectedRoleIds={selectedRoleIds}
                        onChange={handleChange}
                    />
                </div>
            )}
        </ServerSubpageLayout>
    );
};
