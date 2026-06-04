import { useState } from 'react';

import { ChevronLeft } from 'lucide-react';

import {
    useCategoryPermissions,
    useChannelPermissions,
    useRoles,
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
type PermissionGroup = {
    label: string;
    permissions: {
        key: string;
        label: string;
        description: string;
    }[];
};

const getPermissionGroups = (
    targetType: PermissionsEditorTabProps['targetType'],
): PermissionGroup[] => [
    {
        label:
            targetType === 'category'
                ? 'General Category Permissions'
                : 'General Channel Permissions',
        permissions: [
            {
                key:
                    targetType === 'category'
                        ? 'viewCategories'
                        : 'viewChannels',
                label:
                    targetType === 'category'
                        ? 'View Category'
                        : 'View Channel',
                description:
                    targetType === 'category'
                        ? 'Allows members to view this category.'
                        : 'Allows members to view this channel and read past messages.',
            },
            {
                key: 'manageChannels',
                label: 'Manage Channels',
                description:
                    'Allows members to create, edit, or delete channels.',
            },
            {
                key: 'moderateMembers',
                label: 'Moderate Members',
                description:
                    'Allows members to timeout (mute) other members for a specific duration.',
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
                    'Allows members to delete messages by other members.',
            },
            {
                key: 'pinMessages',
                label: 'Pin Messages',
                description:
                    'Allows members to pin or unpin messages in this channel.',
            },
            {
                key: 'addReactions',
                label: 'Add Reactions',
                description: 'Allows members to add new reactions to messages.',
            },
            {
                key: 'manageReactions',
                label: 'Manage Reactions',
                description:
                    'Allows members to remove reactions added by other members.',
            },
            {
                key: 'pingRolesAndEveryone',
                label: 'Mention @everyone',
                description:
                    'Allows members to use @everyone and @here to notify all members.',
            },
            {
                key: 'seeDeletedMessages',
                label: 'See Deleted Messages',
                description:
                    'Allows members to see messages that have been deleted (rendered in red).',
            },
            {
                key: 'bypassMarkdownRestrictions',
                label: 'Bypass Markdown Restrictions',
                description:
                    'Allows members to render markdown even when disallowed markdown features are configured.',
            },
        ],
    },
    {
        label: 'Voice Channel Permissions',
        permissions: [
            {
                key: 'connect',
                label: 'Connect',
                description: 'Allows members to connect to this voice channel.',
            },
        ],
    },
];

const VALID_PERMISSION_KEYS = new Set([
    'sendMessages',
    'manageMessages',
    'deleteMessagesOfOthers',
    'manageChannels',
    'manageRoles',
    'banMembers',
    'kickMembers',
    'manageInvites',
    'manageServer',
    'administrator',
    'manageWebhooks',
    'pingRolesAndEveryone',
    'addReactions',
    'manageReactions',
    'exportChannelMessages',
    'viewCategories',
    'viewChannels',
    'pinMessages',
    'bypassSlowmode',
    'bypassMarkdownRestrictions',
    'connect',
    'seeDeletedMessages',
    'moderateMembers',
    'manageStickers',
]);

const stripUnknownKeys = (
    permsObj: Record<string, unknown>,
): Record<string, boolean> => {
    const clean: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(permsObj)) {
        if (VALID_PERMISSION_KEYS.has(k) && typeof v === 'boolean') {
            clean[k] = v;
        }
    }
    return clean;
};

const normalizeOverrides = (perms: Overrides, roles: Role[]): Overrides => {
    const everyoneRoleId = roles.find(
        (r): boolean => r.name === '@everyone',
    )?.id;
    const normalized: Overrides = {};

    for (const [id, permsObj] of Object.entries(perms)) {
        const key = id === 'everyone' && everyoneRoleId ? everyoneRoleId : id;
        normalized[key] = stripUnknownKeys(permsObj as Record<string, unknown>);
    }
    return normalized;
};

export const PermissionsEditorTab = ({
    serverId,
    targetId,
    targetType,
}: PermissionsEditorTabProps) => {
    const permissionGroups = getPermissionGroups(targetType);
    const { data: roles = [] } = useRoles(serverId);

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
    const [isMobileListOpen, setIsMobileListOpen] = useState(true);

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
        roles.find((r): boolean => r.name === '@everyone')?.id ||
        roles[0]?.id ||
        null;

    const visibleRoles = roles.filter((role): boolean => {
        if (role.name === '@everyone') return true;
        if (selectedRoleId === role.id) return true;
        const overrides = localOverrides[role.id];
        return overrides && Object.keys(overrides).length > 0;
    });

    const availableRolesToAdd = roles.filter(
        (role): boolean =>
            !visibleRoles.some((vr): boolean => vr.id === role.id),
    );

    const handlePermissionChange = (
        roleId: string,
        key: string,
        value: boolean | undefined,
    ): void => {
        setLocalOverrides((prev): { [x: string]: Record<string, boolean> } => {
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
        setSelectedRoleId(role.id);
        setIsMobileListOpen(false);
        setLocalOverrides(
            (prev): Overrides =>
                role.id in prev ? prev : { ...prev, [role.id]: {} },
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

    const selectedRole = roles.find(
        (r): boolean => r.id === effectiveSelectedRoleId,
    );
    const currentRoleOverrides = effectiveSelectedRoleId
        ? (localOverrides[effectiveSelectedRoleId] ?? {})
        : {};

    return (
        <EditorLayout>
            <EditorPanel isMobileListOpen={isMobileListOpen}>
                {/* Mobile Back Header */}
                {!isMobileListOpen && (
                    <div className="sticky top-0 z-20 mx-[-2rem] mb-4 flex w-full shrink-0 items-center border-b border-border-subtle bg-background px-4 px-[2rem] py-4 md:hidden">
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
                            {permissionGroups.map((group) => (
                                <section key={group.label}>
                                    <SectionLabel>{group.label}</SectionLabel>
                                    <div className="overflow-hidden rounded-md border border-border-subtle bg-bg-secondary px-4">
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
                                                onChange={(val): void =>
                                                    handlePermissionChange(
                                                        selectedRole.id,
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
                    onSave={(): void => {
                        void handleSave();
                    }}
                />
            </EditorPanel>

            <RolesSidebar isMobileListOpen={isMobileListOpen}>
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
                            isActive={effectiveSelectedRoleId === role.id}
                            key={role.id}
                            role={role}
                            onClick={(): void => {
                                setSelectedRoleId(role.id);
                                setIsMobileListOpen(false);
                            }}
                        />
                    ))}
                </div>
            </RolesSidebar>
        </EditorLayout>
    );
};
