import React, { useState } from 'react';

import {
    useCategoryPermissions,
    useChannelPermissions,
    useServerRoles,
    useUpdateCategoryPermissions,
    useUpdateChannelPermissions,
} from '@/api/servers/servers.queries';
import type { Role } from '@/api/servers/servers.types';
import { Heading } from '@/ui/components/common/Heading';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { Text } from '@/ui/components/common/Text';

import { PermissionOverrideSwitch } from './PermissionOverrideSwitch';
import {
    EditorLayout,
    EditorPanel,
    EmptyState,
    RolesSidebar,
    SectionLabel,
} from './PermissionsLayout';
import { AddRoleDropdown, RoleListItem } from './PermissionsRoleItems';

interface PermissionsEditorTabProps {
    serverId: string;
    targetId: string;
    targetType: 'channel' | 'category';
}

type Overrides = Record<string, Record<string, boolean>>;

const PERMISSION_GROUPS = [
    {
        label: 'General Channel Permissions',
        permissions: [
            {
                key: 'viewChannels',
                label: 'View Channel',
                description:
                    'Allows members to view this channel and read past messages.',
            },
            {
                key: 'manageChannels',
                label: 'Manage Channels',
                description:
                    'Allows members to create, edit, or delete channels.',
            },
        ],
    },
    {
        label: 'Text Channel Permissions',
        permissions: [
            {
                key: 'sendMessages',
                label: 'Send Messages',
                description: 'Allows members to send messages in this channel.',
            },
            {
                key: 'manageMessages',
                label: 'Manage Messages',
                description:
                    'Allows members to delete or pin messages by other members.',
            },
            {
                key: 'addReactions',
                label: 'Add Reactions',
                description: 'Allows members to add new reactions to messages.',
            },
            {
                key: 'pingRolesAndEveryone',
                label: 'Mention @everyone',
                description:
                    'Allows members to use @everyone and @here to notify all members.',
            },
        ],
    },
] as const;

const normalizeOverrides = (perms: Overrides, roles: Role[]): Overrides => {
    const everyoneRoleId = roles.find((r) => r.name === '@everyone')?._id;
    const normalized: Overrides = {};

    for (const [id, permsObj] of Object.entries(perms)) {
        const key = id === 'everyone' && everyoneRoleId ? everyoneRoleId : id;
        normalized[key] = permsObj;
    }
    return normalized;
};

export const PermissionsEditorTab: React.FC<PermissionsEditorTabProps> = ({
    serverId,
    targetId,
    targetType,
}) => {
    const { data: roles = [] } = useServerRoles(serverId);

    const { data: channelPerms } = useChannelPermissions(serverId, targetId, {
        enabled: targetType === 'channel',
    });
    const { data: categoryPerms } = useCategoryPermissions(serverId, targetId, {
        enabled: targetType === 'category',
    });

    const updateChannelPerms = useUpdateChannelPermissions(serverId, targetId);
    const updateCategoryPerms = useUpdateCategoryPermissions(
        serverId,
        targetId,
    );

    const initialPermissions =
        targetType === 'channel' ? channelPerms : categoryPerms;
    const isSaving =
        updateChannelPerms.isPending || updateCategoryPerms.isPending;

    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [localOverrides, setLocalOverrides] = useState<Overrides>({});
    const [hasChanges, setHasChanges] = useState(false);

    const [prevInitialPermissions, setPrevInitialPermissions] =
        useState(initialPermissions);
    const [prevRoles, setPrevRoles] = useState(roles);

    if (initialPermissions !== prevInitialPermissions || roles !== prevRoles) {
        setPrevInitialPermissions(initialPermissions);
        setPrevRoles(roles);
        if (initialPermissions) {
            setLocalOverrides(normalizeOverrides(initialPermissions, roles));
            setHasChanges(false);
        }
    }

    const effectiveSelectedRoleId =
        selectedRoleId ||
        roles.find((r) => r.name === '@everyone')?._id ||
        roles[0]?._id ||
        null;

    const visibleRoles = roles.filter((role) => {
        if (role.name === '@everyone') return true;
        if (selectedRoleId === role._id) return true;
        const overrides = localOverrides[role._id];
        return overrides && Object.keys(overrides).length > 0;
    });

    const availableRolesToAdd = roles.filter(
        (role) => !visibleRoles.some((vr) => vr._id === role._id),
    );

    const handlePermissionChange = (
        roleId: string,
        key: string,
        value: boolean | undefined,
    ): void => {
        setLocalOverrides((prev) => {
            const next = { ...prev };
            if (!next[roleId]) next[roleId] = {};

            if (value === undefined) {
                delete next[roleId][key];
                if (Object.keys(next[roleId]).length === 0) delete next[roleId];
            } else {
                next[roleId][key] = value;
            }
            return next;
        });
        setHasChanges(true);
    };

    const handleAddRole = (role: Role): void => {
        setSelectedRoleId(role._id);
        setLocalOverrides((prev) =>
            role._id in prev ? prev : { ...prev, [role._id]: {} },
        );
    };

    const handleSave = async (): Promise<void> => {
        try {
            if (targetType === 'channel') {
                await updateChannelPerms.mutateAsync(localOverrides);
            } else {
                await updateCategoryPerms.mutateAsync(localOverrides);
            }
            setHasChanges(false);
        } catch (error) {
            console.error('Failed to save permissions', error);
        }
    };

    const handleReset = (): void => {
        setLocalOverrides(
            initialPermissions
                ? normalizeOverrides(initialPermissions, roles)
                : {},
        );
        setHasChanges(false);
    };

    const selectedRole = roles.find((r) => r._id === effectiveSelectedRoleId);
    const currentRoleOverrides = effectiveSelectedRoleId
        ? (localOverrides[effectiveSelectedRoleId] ?? {})
        : {};

    return (
        <EditorLayout>
            <EditorPanel>
                {selectedRole ? (
                    <>
                        <div>
                            <Heading
                                className="mb-1"
                                level={2}
                                variant="section"
                            >
                                {selectedRole.name === '@everyone'
                                    ? '@everyone'
                                    : `Role: ${selectedRole.name}`}
                            </Heading>
                            <Text variant="muted">
                                {selectedRole.name === '@everyone'
                                    ? `Modify permissions for all members in this ${targetType}.`
                                    : `Override permissions for the ${selectedRole.name} role in this ${targetType}.`}
                            </Text>
                        </div>

                        <div className="space-y-6">
                            {PERMISSION_GROUPS.map((group) => (
                                <section key={group.label}>
                                    <SectionLabel>{group.label}</SectionLabel>
                                    <div className="bg-[var(--color-bg-secondary)] rounded-md border border-[var(--color-border-subtle)] overflow-hidden px-4">
                                        {group.permissions.map((perm) => (
                                            <PermissionOverrideSwitch
                                                description={perm.description}
                                                key={perm.key}
                                                label={perm.label}
                                                value={
                                                    currentRoleOverrides[
                                                        perm.key
                                                    ]
                                                }
                                                onChange={(val) =>
                                                    handlePermissionChange(
                                                        selectedRole._id,
                                                        perm.key,
                                                        val,
                                                    )
                                                }
                                            />
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </>
                ) : (
                    <EmptyState message="Select a role to edit its permissions." />
                )}

                <SettingsFloatingBar
                    isFixed={false}
                    isPending={isSaving}
                    isVisible={hasChanges}
                    onReset={handleReset}
                    onSave={() => {
                        void handleSave();
                    }}
                />
            </EditorPanel>

            <RolesSidebar>
                <div className="flex items-center justify-between">
                    <SectionLabel>Roles/Members</SectionLabel>
                    <AddRoleDropdown
                        availableRoles={availableRolesToAdd}
                        onAdd={handleAddRole}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    {visibleRoles.map((role) => (
                        <RoleListItem
                            isActive={effectiveSelectedRoleId === role._id}
                            key={role._id}
                            role={role}
                            onClick={() => setSelectedRoleId(role._id)}
                        />
                    ))}
                </div>
            </RolesSidebar>
        </EditorLayout>
    );
};
