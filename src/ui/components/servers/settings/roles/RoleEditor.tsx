import React, { useState } from 'react';

import { Plus, Repeat, Trash2 } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';

import type { Role, RolePermissions } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import { Message } from '@/ui/components/chat/Message';
import { Button } from '@/ui/components/common/Button';
import { IconButton } from '@/ui/components/common/IconButton';
import { Input } from '@/ui/components/common/Input';
import { Text } from '@/ui/components/common/Text';
import { Toggle } from '@/ui/components/common/Toggle';
import { UserItem } from '@/ui/components/common/UserItem';
import { cn } from '@/utils/cn';

interface RoleEditorProps {
    role: Role;
    onSave: (
        updates: Partial<Role> & { permissions?: RolePermissions },
    ) => void;
    onReset: () => void;
}

type ColorType = 'solid' | 'linear' | 'custom';

export const RoleEditor: React.FC<RoleEditorProps> = ({
    role,
    onSave,
    onReset,
}) => {
    const { data: me } = useMe();
    const [name, setName] = useState(role.name);

    // Color states
    const [colorType, setColorType] = useState<ColorType>(
        role.colors && role.colors.length > 0
            ? 'custom'
            : role.startColor && role.endColor
              ? 'linear'
              : 'solid',
    );
    const [solidColor, setSolidColor] = useState(role.color || '#99aab5');
    const [startColor, setStartColor] = useState(role.startColor || '#99aab5');
    const [endColor, setEndColor] = useState(role.endColor || '#2c2f33');
    const [customColorItems, setCustomColorItems] = useState<
        { id: string; color: string }[]
    >(() =>
        (role.colors || ['#99aab5', '#2c2f33']).map((c, i) => ({
            id: `color-${role._id}-${i}`,
            color: c,
        })),
    );
    const [gradientRepeat, setGradientRepeat] = useState(
        role.gradientRepeat || 1,
    );

    const [permissions, setPermissions] = useState<Partial<RolePermissions>>(
        role.permissions || {},
    );
    const [hasChanges, setHasChanges] = useState(false);

    const resetState = (): void => {
        setName(role.name);
        const type =
            role.colors && role.colors.length > 0
                ? 'custom'
                : role.startColor && role.endColor
                  ? 'linear'
                  : 'solid';
        setColorType(type);
        setSolidColor(role.color || '#99aab5');
        setStartColor(role.startColor || '#99aab5');
        setEndColor(role.endColor || '#2c2f33');
        setCustomColorItems(
            (role.colors || ['#99aab5', '#2c2f33']).map((c, i) => ({
                id: `color-${role._id}-${i}`,
                color: c,
            })),
        );
        setGradientRepeat(role.gradientRepeat || 1);
        setPermissions(role.permissions || {});
        setHasChanges(false);
    };

    const handleSave = (): void => {
        const updates: Partial<Role> & {
            permissions?: RolePermissions;
            gradientRepeat?: number;
        } = {
            name,
            permissions: permissions as RolePermissions,
        };

        if (colorType === 'solid') {
            updates.color = solidColor;
            updates.startColor = undefined;
            updates.endColor = undefined;
            updates.colors = undefined;
        } else if (colorType === 'linear') {
            updates.color = undefined;
            updates.startColor = startColor;
            updates.endColor = endColor;
            updates.colors = undefined;
        } else if (colorType === 'custom') {
            updates.color = undefined;
            updates.startColor = undefined;
            updates.endColor = undefined;
            updates.colors = customColorItems.map((item) => item.color);
            updates.gradientRepeat = gradientRepeat;
        }

        onSave(updates);
        setHasChanges(false);
    };

    const handleReset = (): void => {
        onReset();
        resetState();
    };

    const updatePermission = (
        key: keyof RolePermissions,
        value: boolean,
    ): void => {
        setPermissions((prev) => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const isEveryone = role.name === '@everyone';

    const getPreviewRole = (): Role => {
        const preview: Role = { ...role, name };
        if (colorType === 'solid') {
            preview.color = solidColor;
            preview.startColor = undefined;
            preview.endColor = undefined;
            preview.colors = undefined;
        } else if (colorType === 'linear') {
            preview.color = null;
            preview.startColor = startColor;
            preview.endColor = endColor;
            preview.colors = undefined;
        } else if (colorType === 'custom') {
            preview.color = null;
            preview.startColor = undefined;
            preview.endColor = undefined;
            preview.colors = customColorItems.map((item) => item.color);
            preview.gradientRepeat = gradientRepeat;
        }
        return preview;
    };

    const previewRole = getPreviewRole();

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--color-background)]">
            <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full space-y-8 pb-24">
                {/* General Settings */}
                <section className="space-y-4">
                    <Text
                        className="border-b border-[var(--color-border-subtle)] pb-2"
                        size="lg"
                        weight="bold"
                    >
                        General Settings
                    </Text>

                    <div className="space-y-2">
                        <label
                            className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase"
                            htmlFor="roleName"
                        >
                            Role Name
                        </label>
                        <input
                            className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-md px-4 py-2 text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] disabled:opacity-50"
                            disabled={isEveryone}
                            id="roleName"
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setHasChanges(true);
                            }}
                        />
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase">
                                Role Color
                            </span>
                            <div className="flex bg-[var(--color-bg-secondary)] rounded-md p-1 border border-[var(--color-border-subtle)]">
                                {(['solid', 'linear', 'custom'] as const).map(
                                    (type) => (
                                        <Button
                                            className={cn(
                                                'px-3 py-1 text-xs font-semibold rounded capitalize transition-all border-none shadow-none',
                                                colorType === type
                                                    ? 'bg-[var(--color-primary)] text-[var(--color-foreground-inverse)] hover:bg-[var(--color-primary-hover)]'
                                                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-bg-secondary)]',
                                            )}
                                            key={type}
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setColorType(type);
                                                setHasChanges(true);
                                            }}
                                        >
                                            {type}
                                        </Button>
                                    ),
                                )}
                            </div>
                        </div>

                        <div className="flex gap-8 items-start">
                            <div className="space-y-4 min-w-[200px]">
                                {colorType === 'solid' && (
                                    <div className="space-y-4">
                                        <HexColorPicker
                                            color={solidColor}
                                            onChange={(newColor) => {
                                                setSolidColor(newColor);
                                                setHasChanges(true);
                                            }}
                                        />
                                        <input
                                            className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-md px-4 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
                                            type="text"
                                            value={solidColor}
                                            onChange={(e) => {
                                                setSolidColor(e.target.value);
                                                setHasChanges(true);
                                            }}
                                        />
                                    </div>
                                )}

                                {colorType === 'linear' && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Text
                                                size="xs"
                                                variant="muted"
                                                weight="bold"
                                            >
                                                START COLOR
                                            </Text>
                                            <HexColorPicker
                                                color={startColor}
                                                onChange={(val) => {
                                                    setStartColor(val);
                                                    setHasChanges(true);
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Text
                                                size="xs"
                                                variant="muted"
                                                weight="bold"
                                            >
                                                END COLOR
                                            </Text>
                                            <HexColorPicker
                                                color={endColor}
                                                onChange={(val) => {
                                                    setEndColor(val);
                                                    setHasChanges(true);
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {colorType === 'custom' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Text
                                                size="xs"
                                                variant="muted"
                                                weight="bold"
                                            >
                                                COLORS
                                            </Text>
                                            <IconButton
                                                className="w-6 h-6 p-0"
                                                icon={Plus}
                                                iconSize={14}
                                                variant="ghost"
                                                onClick={() => {
                                                    setCustomColorItems([
                                                        ...customColorItems,
                                                        {
                                                            id: `color-new-${Math.random()}`,
                                                            color: '#ffffff',
                                                        },
                                                    ]);
                                                    setHasChanges(true);
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                                            {customColorItems.map((item, i) => (
                                                <div
                                                    className="flex gap-2 items-center"
                                                    key={item.id}
                                                >
                                                    <div
                                                        className="w-8 h-8 rounded shrink-0 border border-[var(--color-border-subtle)]"
                                                        style={{
                                                            backgroundColor:
                                                                item.color,
                                                        }}
                                                    />
                                                    <input
                                                        className="flex-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded px-2 py-1 text-xs text-[var(--color-foreground)]"
                                                        type="text"
                                                        value={item.color}
                                                        onChange={(e) => {
                                                            const newItems = [
                                                                ...customColorItems,
                                                            ];
                                                            newItems[i] = {
                                                                ...item,
                                                                color: e.target
                                                                    .value,
                                                            };
                                                            setCustomColorItems(
                                                                newItems,
                                                            );
                                                            setHasChanges(true);
                                                        }}
                                                    />
                                                    {customColorItems.length >
                                                        2 && (
                                                        <IconButton
                                                            className="w-6 h-6 p-0 text-[var(--color-danger)]"
                                                            icon={Trash2}
                                                            iconSize={14}
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setCustomColorItems(
                                                                    customColorItems.filter(
                                                                        (
                                                                            _,
                                                                            idx,
                                                                        ) =>
                                                                            idx !==
                                                                            i,
                                                                    ),
                                                                );
                                                                setHasChanges(
                                                                    true,
                                                                );
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pt-2 flex items-center gap-4">
                                            <div className="flex-1 space-y-1">
                                                <Text
                                                    size="xs"
                                                    variant="muted"
                                                    weight="bold"
                                                >
                                                    REPEAT
                                                </Text>
                                                <div className="flex items-center gap-2">
                                                    <Repeat
                                                        className="text-[var(--color-muted-foreground)]"
                                                        size={14}
                                                    />
                                                    <Input
                                                        className="w-full text-xs"
                                                        max={10}
                                                        min={1}
                                                        type="number"
                                                        value={gradientRepeat}
                                                        onChange={(e) => {
                                                            setGradientRepeat(
                                                                parseInt(
                                                                    e.target
                                                                        .value,
                                                                ) || 1,
                                                            );
                                                            setHasChanges(true);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-4">
                                <Text size="sm" variant="muted">
                                    Members with this role will have their name
                                    displayed in this style in the member list
                                    and in messages.
                                </Text>
                                <div className="p-4 rounded-md border border-[var(--color-border-subtle)] bg-[var(--tertiary-bg)] w-64">
                                    {me && (
                                        <UserItem
                                            noFetch
                                            role={previewRole}
                                            user={me}
                                            userId={me._id}
                                        />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Text
                                        className="uppercase tracking-wider"
                                        size="xs"
                                        variant="muted"
                                        weight="bold"
                                    >
                                        Preview Text
                                    </Text>
                                    <div className="bg-[var(--color-bg-secondary)] rounded-md border border-[var(--color-border-subtle)] overflow-hidden">
                                        {me && (
                                            <Message
                                                isGroupStart
                                                message={{
                                                    _id: 'preview',
                                                    text: 'Hello! This is how your role colors will look in the chat.',
                                                    createdAt:
                                                        new Date().toISOString(),
                                                    serverId: 'preview',
                                                    channelId: 'preview',
                                                    senderId: me._id,
                                                    role: previewRole,
                                                    user: me,
                                                }}
                                                role={previewRole}
                                                user={me}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Permissions Settings */}
                <section className="space-y-4 pt-4 border-t border-[var(--color-border-subtle)]">
                    <Text size="lg" weight="bold">
                        Permissions
                    </Text>
                    <div className="space-y-4">
                        <PermissionToggle
                            danger
                            description="Gives all permissions. This is a dangerous permission to grant."
                            label="Administrator"
                            value={permissions.administrator || false}
                            onChange={(val) =>
                                updatePermission('administrator', val)
                            }
                        />
                        <PermissionToggle
                            description="Allows member to change server name, region, or icon."
                            label="Manage Server"
                            value={permissions.manageServer || false}
                            onChange={(val) =>
                                updatePermission('manageServer', val)
                            }
                        />
                        <PermissionToggle
                            description="Allows member to create, edit, or delete roles below them."
                            label="Manage Roles"
                            value={permissions.manageRoles || false}
                            onChange={(val) =>
                                updatePermission('manageRoles', val)
                            }
                        />
                        <PermissionToggle
                            description="Allows member to create, edit, or delete channels."
                            label="Manage Channels"
                            value={permissions.manageChannels || false}
                            onChange={(val) =>
                                updatePermission('manageChannels', val)
                            }
                        />
                        <PermissionToggle
                            danger
                            description="Allows member to kick other members."
                            label="Kick Members"
                            value={permissions.kickMembers || false}
                            onChange={(val) =>
                                updatePermission('kickMembers', val)
                            }
                        />
                        <PermissionToggle
                            danger
                            description="Allows member to ban other members."
                            label="Ban Members"
                            value={permissions.banMembers || false}
                            onChange={(val) =>
                                updatePermission('banMembers', val)
                            }
                        />
                        <PermissionToggle
                            description="Allows member to send messages in text channels."
                            label="Send Messages"
                            value={permissions.sendMessages !== false}
                            onChange={(val) =>
                                updatePermission('sendMessages', val)
                            }
                        />
                        <PermissionToggle
                            description="Allows member to delete or pin messages by other members."
                            label="Manage Messages"
                            value={permissions.manageMessages || false}
                            onChange={(val) =>
                                updatePermission('manageMessages', val)
                            }
                        />
                        <PermissionToggle
                            description="Allows member to add new reactions to messages."
                            label="Add Reactions"
                            value={permissions.addReactions !== false}
                            onChange={(val) =>
                                updatePermission('addReactions', val)
                            }
                        />
                        <PermissionToggle
                            description="Allows member to use @everyone and @here to notify all members."
                            label="Mention @everyone"
                            value={permissions.pingRolesAndEveryone || false}
                            onChange={(val) =>
                                updatePermission('pingRolesAndEveryone', val)
                            }
                        />
                    </div>
                </section>
            </div>

            {/* Floating Save Bar */}
            {hasChanges && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-3xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-lg p-3 flex items-center justify-between shadow-2xl animate-in fade-in slide-in-from-bottom-4">
                    <Text size="sm" weight="semibold">
                        Careful — you have unsaved changes!
                    </Text>
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={handleReset}>
                            Reset
                        </Button>
                        <Button
                            className="bg-[var(--color-success)] hover:bg-[var(--color-success-hover)] text-white"
                            size="sm"
                            variant="normal"
                            onClick={handleSave}
                        >
                            Save Changes
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

interface PermissionToggleProps {
    label: string;
    description: string;
    value: boolean;
    onChange: (value: boolean) => void;
    danger?: boolean;
}

const PermissionToggle: React.FC<PermissionToggleProps> = ({
    label,
    description,
    value,
    onChange,
    danger,
}) => (
    <div className="flex items-center justify-between py-2">
        <div className="flex-1 pr-4">
            <Text
                className={cn(
                    'block mb-1',
                    danger && 'text-[var(--color-danger)]',
                )}
                weight="semibold"
            >
                {label}
            </Text>
            <Text className="block leading-snug" size="xs" variant="muted">
                {description}
            </Text>
        </div>
        <Toggle checked={value} onCheckedChange={onChange} />
    </div>
);
