import React, { useState } from 'react';

import { Image as ImageIcon, Plus, Repeat, Trash2, Upload } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';

import { serversApi } from '@/api/servers/servers.api';
import type { Role, RolePermissions } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import { Message } from '@/ui/components/chat/Message';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { IconButton } from '@/ui/components/common/IconButton';
import { Input } from '@/ui/components/common/Input';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { Text } from '@/ui/components/common/Text';
import { Toggle } from '@/ui/components/common/Toggle';
import { UserItem } from '@/ui/components/common/UserItem';
import { ImageCropModal } from '@/ui/components/settings/ImageCropModal';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';

interface RoleEditorProps {
    role: Role;
    onSave: (
        updates: Partial<Role> & { permissions?: RolePermissions },
    ) => void;
    onReset: () => void;
    disableCustomFonts?: boolean;
    disableGlowAndColors?: boolean;
}

type ColorType = 'solid' | 'linear' | 'custom';

export const RoleEditor: React.FC<RoleEditorProps> = ({
    role,
    onSave,
    onReset,
    disableCustomFonts,
    disableGlowAndColors,
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

    const [selectedIcon, setSelectedIcon] = useState<File | null>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [previewIcon, setPreviewIcon] = useState<string | null>(
        role.icon
            ? resolveApiUrl(
                  `/api/v1/servers/${role.serverId}/roles/icon/${role.icon}`,
              )
            : null,
    );

    const handleIconSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
        if (e.target.files && e.target.files[0]) {
            setSelectedIcon(e.target.files[0]);
            setIsCropModalOpen(true);
        }
    };

    const handleIconCrop = async (croppedFile: File): Promise<void> => {
        // Optimistically show the cropped image
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                setPreviewIcon(e.target.result as string);
            }
        };
        reader.readAsDataURL(croppedFile);

        // Upload immediately
        try {
            await serversApi.uploadRoleIcon(
                role.serverId,
                role._id,
                croppedFile,
            );
        } catch (error) {
            console.error('Failed to upload role icon', error);
        }
    };

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
        <>
            <div className="flex h-full flex-1 flex-col overflow-hidden bg-background">
                <div className="mx-auto w-full max-w-3xl flex-1 space-y-8 overflow-y-auto p-8 pb-24">
                    {/* General Settings */}
                    <section className="space-y-4">
                        <Heading
                            className="border-b border-border-subtle pb-2"
                            level={3}
                            variant="section"
                        >
                            General Settings
                        </Heading>

                        <div className="space-y-2">
                            <label
                                className="text-xs font-bold text-muted-foreground uppercase"
                                htmlFor="roleName"
                            >
                                Role Name
                            </label>
                            <Input
                                disabled={isEveryone}
                                id="roleName"
                                type="text"
                                value={name}
                                variant="secondary"
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setHasChanges(true);
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                className="text-xs font-bold text-muted-foreground uppercase"
                                htmlFor="roleIcon"
                            >
                                Role Icon
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded border border-border-subtle bg-bg-secondary">
                                    {previewIcon ? (
                                        <img
                                            alt="Role Icon"
                                            className="h-full w-full object-cover"
                                            src={previewIcon}
                                        />
                                    ) : (
                                        <ImageIcon
                                            className="text-muted-foreground"
                                            size={24}
                                        />
                                    )}
                                    <button
                                        className="absolute inset-0 flex h-full w-full cursor-pointer items-center justify-center border-none bg-black/50 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                                        type="button"
                                        onClick={() =>
                                            document
                                                .getElementById(
                                                    'role-icon-upload',
                                                )
                                                ?.click()
                                        }
                                    >
                                        <Upload
                                            className="text-white"
                                            size={20}
                                        />
                                    </button>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <Text size="sm" variant="muted">
                                        Upload an image to be displayed next to
                                        the role name.
                                    </Text>

                                    <input
                                        accept=".png,.jpg,.jpeg,.webp,.gif"
                                        className="hidden"
                                        id="role-icon-upload"
                                        type="file"
                                        onChange={handleIconSelect}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground uppercase">
                                    Role Color
                                </span>
                                <div className="flex rounded-md border border-border-subtle bg-bg-secondary p-1">
                                    {(
                                        ['solid', 'linear', 'custom'] as const
                                    ).map((type) => (
                                        <Button
                                            className={cn(
                                                'rounded border-none px-3 py-1 text-xs font-semibold capitalize shadow-none transition-all',
                                                colorType === type
                                                    ? 'bg-primary text-foreground-inverse hover:bg-primary-hover'
                                                    : 'text-muted-foreground hover:bg-bg-secondary hover:text-foreground',
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
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-start gap-8">
                                <div className="min-w-[200px] space-y-4">
                                    {colorType === 'solid' && (
                                        <div className="space-y-4">
                                            <HexColorPicker
                                                color={solidColor}
                                                onChange={(newColor) => {
                                                    setSolidColor(newColor);
                                                    setHasChanges(true);
                                                }}
                                            />
                                            <Input
                                                type="text"
                                                value={solidColor}
                                                variant="secondary"
                                                onChange={(e) => {
                                                    setSolidColor(
                                                        e.target.value,
                                                    );
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
                                                    COLORS (MAX 15)
                                                </Text>
                                                <IconButton
                                                    className="h-8 w-8 p-0"
                                                    disabled={
                                                        customColorItems.length >=
                                                        15
                                                    }
                                                    icon={Plus}
                                                    iconSize={18}
                                                    title={
                                                        customColorItems.length >=
                                                        15
                                                            ? 'Maximum of 15 colors reached'
                                                            : 'Add Color'
                                                    }
                                                    variant="ghost"
                                                    onClick={() => {
                                                        if (
                                                            customColorItems.length >=
                                                            15
                                                        )
                                                            return;
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
                                            <div className="scrollbar-thin max-h-[300px] space-y-2 overflow-y-auto pr-2">
                                                {customColorItems.map(
                                                    (item, i) => (
                                                        <div
                                                            className="flex items-center gap-2"
                                                            key={item.id}
                                                        >
                                                            <div
                                                                className="h-8 w-8 shrink-0 rounded border border-border-subtle"
                                                                style={{
                                                                    backgroundColor:
                                                                        item.color,
                                                                }}
                                                            />
                                                            <Input
                                                                size="sm"
                                                                type="text"
                                                                value={
                                                                    item.color
                                                                }
                                                                variant="secondary"
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const newItems =
                                                                        [
                                                                            ...customColorItems,
                                                                        ];
                                                                    newItems[
                                                                        i
                                                                    ] = {
                                                                        ...item,
                                                                        color: e
                                                                            .target
                                                                            .value,
                                                                    };
                                                                    setCustomColorItems(
                                                                        newItems,
                                                                    );
                                                                    setHasChanges(
                                                                        true,
                                                                    );
                                                                }}
                                                            />
                                                            {customColorItems.length >
                                                                2 && (
                                                                <IconButton
                                                                    className="h-8 w-8 p-0 text-danger"
                                                                    icon={
                                                                        Trash2
                                                                    }
                                                                    iconSize={
                                                                        18
                                                                    }
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
                                                    ),
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 pt-2">
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
                                                            className="text-muted-foreground"
                                                            size={14}
                                                        />
                                                        <Input
                                                            className="w-full text-xs"
                                                            max={10}
                                                            min={1}
                                                            type="number"
                                                            value={
                                                                gradientRepeat
                                                            }
                                                            onChange={(e) => {
                                                                setGradientRepeat(
                                                                    parseInt(
                                                                        e.target
                                                                            .value,
                                                                    ) || 1,
                                                                );
                                                                setHasChanges(
                                                                    true,
                                                                );
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
                                        Members with this role will have their
                                        name displayed in this style in the
                                        member list and in messages.
                                    </Text>
                                    <div className="w-64 rounded-md border border-border-subtle bg-[var(--tertiary-bg)] p-4">
                                        {me && (
                                            <UserItem
                                                noFetch
                                                disableCustomFonts={
                                                    disableCustomFonts
                                                }
                                                disableGlowAndColors={
                                                    disableGlowAndColors
                                                }
                                                role={previewRole}
                                                user={me}
                                                userId={me._id}
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Text
                                            size="xs"
                                            tracking="wider"
                                            transform="uppercase"
                                            variant="muted"
                                            weight="bold"
                                        >
                                            Preview Text
                                        </Text>
                                        <div className="overflow-hidden rounded-md border border-border-subtle bg-bg-secondary">
                                            {me && (
                                                <Message
                                                    isGroupStart
                                                    disableCustomFonts={
                                                        disableCustomFonts
                                                    }
                                                    disableGlowAndColors={
                                                        disableGlowAndColors
                                                    }
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
                    <section className="space-y-4 border-t border-border-subtle pt-4">
                        <Heading level={2}>Permissions</Heading>
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
                                description="Allows member to view channels."
                                label="View Channels"
                                value={permissions.viewChannels !== false}
                                onChange={(val) =>
                                    updatePermission('viewChannels', val)
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
                                value={
                                    permissions.pingRolesAndEveryone || false
                                }
                                onChange={(val) =>
                                    updatePermission(
                                        'pingRolesAndEveryone',
                                        val,
                                    )
                                }
                            />
                        </div>
                    </section>
                </div>

                {/* Floating Save Bar */}
                <SettingsFloatingBar
                    isFixed={false}
                    isVisible={hasChanges}
                    onReset={handleReset}
                    onSave={handleSave}
                />
            </div>
            <ImageCropModal
                imageFile={selectedIcon}
                isOpen={isCropModalOpen}
                type="role-icon"
                onClose={() => setIsCropModalOpen(false)}
                onConfirm={(file) => {
                    void handleIconCrop(file);
                }}
            />
        </>
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
                as="p"
                variant={danger ? 'danger' : 'default'}
                weight="semibold"
            >
                {label}
            </Text>
            <Text as="p" leading="snug" size="xs" variant="muted">
                {description}
            </Text>
        </div>
        <Toggle checked={value} onCheckedChange={onChange} />
    </div>
);
