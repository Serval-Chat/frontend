import React, { useReducer } from 'react';

import { serversApi } from '@/api/servers/servers.api';
import type { Role, RolePermissions } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import { Heading } from '@/ui/components/common/Heading';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { ImageCropModal } from '@/ui/components/settings/ImageCropModal';
import { resolveApiUrl } from '@/utils/apiUrl';
import { mergeReducer } from '@/utils/mergeReducer';

import { RoleAppearanceBasics } from './RoleAppearanceBasics';
import { RoleColorSection } from './RoleColorSection';
import { RoleGeneralSection } from './RoleGeneralSection';
import { RolePermissionsSection } from './RolePermissionsSection';

interface RoleEditorProps {
    role: Role;
    onSave: (
        updates: Partial<Role> & { permissions?: RolePermissions },
    ) => void;
    onReset: () => void;
    disableCustomFonts?: boolean;
    disableGlowAndColors?: boolean;
}

type ColorType = 'solid' | 'custom';
interface ColorItem {
    id: string;
    color: string;
}

interface RoleEditorState {
    name: string;
    description: string;
    colorType: ColorType;
    solidColor: string;
    customColorItems: ColorItem[];
    gradientRepeat: number;
    glowEnabled: boolean;
    separateFromOtherRoles: boolean;
    permissions: Partial<RolePermissions>;
    hasChanges: boolean;
    selectedIcon: File | null;
    isCropModalOpen: boolean;
    previewIcon: string | null;
}

const initColorItems = (role: Role): ColorItem[] => {
    if (role.colors && role.colors.length > 0) {
        return role.colors.map(
            (c, i): ColorItem => ({
                id: `color-${role.id}-${i}`,
                color: c,
            }),
        );
    } else if (role.startColor && role.endColor) {
        return [
            { id: `color-${role.id}-0`, color: role.startColor },
            { id: `color-${role.id}-1`, color: role.endColor },
        ];
    }
    return [
        { id: `color-${role.id}-0`, color: '#99aab5' },
        { id: `color-${role.id}-1`, color: '#2c2f33' },
    ];
};

const initState = (role: Role): RoleEditorState => ({
    name: role.name,
    description: role.description ?? '',
    colorType:
        (role.colors && role.colors.length > 0) ||
        (role.startColor && role.endColor)
            ? 'custom'
            : 'solid',
    solidColor: role.color || '#99aab5',
    customColorItems: initColorItems(role),
    gradientRepeat: role.gradientRepeat || 1,
    glowEnabled: role.glowEnabled !== false,
    separateFromOtherRoles: role.separateFromOtherRoles || false,
    permissions: role.permissions || {},
    hasChanges: false,
    selectedIcon: null,
    isCropModalOpen: false,
    previewIcon: role.icon
        ? resolveApiUrl(
              `/api/v1/servers/${role.serverId}/roles/icon/${role.icon}`,
          )
        : null,
});

export const RoleEditor = ({
    role,
    onSave,
    onReset,
    disableCustomFonts,
    disableGlowAndColors,
}: RoleEditorProps) => {
    const { data: me } = useMe();
    // deliberately editable draft, not a stale-prop-copy bug: the only caller
    // renders this behind `key={selectedRole.id}`, so switching roles forces a
    // full remount (fresh initial state) instead of leaving stale field values.
    const [state, patch] = useReducer(
        mergeReducer<RoleEditorState>,
        role,
        initState,
    );
    const {
        name,
        description,
        colorType,
        solidColor,
        customColorItems,
        gradientRepeat,
        glowEnabled,
        separateFromOtherRoles,
        permissions,
        hasChanges,
        selectedIcon,
        isCropModalOpen,
        previewIcon,
    } = state;

    const handleIconSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
        if (e.target.files?.[0]) {
            patch({ selectedIcon: e.target.files[0], isCropModalOpen: true });
        }
    };

    const handleIconCrop = async (croppedFile: File): Promise<void> => {
        // Optimistically show the cropped image
        const reader = new FileReader();
        reader.addEventListener('load', (e): void => {
            if (e.target?.result) {
                patch({ previewIcon: e.target.result as string });
            }
        });
        reader.readAsDataURL(croppedFile);

        // Upload immediately
        try {
            await serversApi.uploadRoleIcon(
                role.serverId,
                role.id,
                croppedFile,
            );
        } catch (error) {
            console.error('Failed to upload role icon', error);
        }
    };

    const resetState = (): void => {
        const fresh = initState(role);
        patch({
            name: fresh.name,
            description: fresh.description,
            colorType: fresh.colorType,
            solidColor: fresh.solidColor,
            customColorItems: fresh.customColorItems,
            gradientRepeat: fresh.gradientRepeat,
            glowEnabled: fresh.glowEnabled,
            separateFromOtherRoles: fresh.separateFromOtherRoles,
            permissions: fresh.permissions,
            hasChanges: false,
        });
    };

    const handleSave = (): void => {
        const updates: Partial<Role> & {
            permissions?: RolePermissions;
            gradientRepeat?: number;
        } = {
            name,
            description: description.trim() || undefined,
            permissions: permissions as RolePermissions,
        };

        if (colorType === 'solid') {
            updates.color = solidColor;
            updates.startColor = undefined;
            updates.endColor = undefined;
            updates.colors = undefined;
        } else if (colorType === 'custom') {
            updates.color = undefined;
            updates.startColor = undefined;
            updates.endColor = undefined;
            updates.colors = customColorItems.map((item): string => item.color);
            updates.gradientRepeat = gradientRepeat;
        }

        onSave({ ...updates, glowEnabled, separateFromOtherRoles });
        patch({ hasChanges: false });
    };

    const handleReset = (): void => {
        onReset();
        resetState();
    };

    const updatePermission = (
        key: keyof RolePermissions,
        value: boolean,
    ): void => {
        patch({
            permissions: { ...permissions, [key]: value },
            hasChanges: true,
        });
    };

    const isEveryone = role.name === '@everyone';

    const previewRole = ((): Role => {
        const preview: Role = { ...role, name };
        if (colorType === 'solid') {
            preview.color = solidColor;
            preview.startColor = undefined;
            preview.endColor = undefined;
            preview.colors = undefined;
        } else if (colorType === 'custom') {
            preview.color = null;
            preview.startColor = undefined;
            preview.endColor = undefined;
            preview.colors = customColorItems.map((item): string => item.color);
            preview.gradientRepeat = gradientRepeat;
        }
        preview.glowEnabled = glowEnabled;
        preview.separateFromOtherRoles = separateFromOtherRoles;
        return preview;
    })();

    return (
        <>
            <div className="flex h-full flex-1 flex-col overflow-hidden bg-background">
                <div className="mx-auto w-full max-w-3xl flex-1 space-y-8 overflow-y-auto p-8 pb-24">
                    <RoleGeneralSection
                        description={description}
                        isEveryone={isEveryone}
                        name={name}
                        onChangeDescription={(value): void => {
                            patch({ description: value, hasChanges: true });
                        }}
                        onChangeName={(value): void => {
                            patch({ name: value, hasChanges: true });
                        }}
                    />

                    <section className="space-y-4 border-t border-border-subtle pt-4">
                        <Heading
                            className="border-b border-border-subtle pb-2"
                            level={3}
                            variant="section"
                        >
                            Appearance
                        </Heading>

                        <RoleAppearanceBasics
                            glowEnabled={glowEnabled}
                            previewIcon={previewIcon}
                            separateFromOtherRoles={separateFromOtherRoles}
                            onChangeGlow={(value): void => {
                                patch({ glowEnabled: value, hasChanges: true });
                            }}
                            onChangeSeparate={(value): void => {
                                patch({
                                    separateFromOtherRoles: value,
                                    hasChanges: true,
                                });
                            }}
                            onIconSelect={handleIconSelect}
                        />

                        <RoleColorSection
                            colorType={colorType}
                            customColorItems={customColorItems}
                            disableCustomFonts={disableCustomFonts}
                            disableGlowAndColors={disableGlowAndColors}
                            gradientRepeat={gradientRepeat}
                            me={me}
                            previewRole={previewRole}
                            solidColor={solidColor}
                            onChangeColorType={(type): void => {
                                patch({ colorType: type, hasChanges: true });
                            }}
                            onChangeCustomColorItems={(items): void => {
                                patch({
                                    customColorItems: items,
                                    hasChanges: true,
                                });
                            }}
                            onChangeGradientRepeat={(value): void => {
                                patch({
                                    gradientRepeat: value,
                                    hasChanges: true,
                                });
                            }}
                            onChangeSolidColor={(color): void => {
                                patch({ solidColor: color, hasChanges: true });
                            }}
                        />
                    </section>

                    <RolePermissionsSection
                        permissions={permissions}
                        onChange={updatePermission}
                    />
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
                onClose={(): void => {
                    patch({ isCropModalOpen: false });
                }}
                onConfirm={(file): void => {
                    void handleIconCrop(file);
                }}
            />
        </>
    );
};
