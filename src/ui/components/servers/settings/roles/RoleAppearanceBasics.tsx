import React from 'react';

import { Image as ImageIcon, Upload } from 'lucide-react';

import { Text } from '@/ui/components/common/Text';
import { Toggle } from '@/ui/components/common/Toggle';

interface RoleAppearanceBasicsProps {
    previewIcon: string | null;
    glowEnabled: boolean;
    separateFromOtherRoles: boolean;
    onIconSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onChangeGlow: (value: boolean) => void;
    onChangeSeparate: (value: boolean) => void;
}

export const RoleAppearanceBasics = ({
    previewIcon,
    glowEnabled,
    separateFromOtherRoles,
    onIconSelect,
    onChangeGlow,
    onChangeSeparate,
}: RoleAppearanceBasicsProps): React.ReactNode => (
    <>
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
                        onClick={(): void | undefined =>
                            (
                                document.querySelector(
                                    '#role-icon-upload',
                                ) as HTMLElement | null
                            )?.click()
                        }
                    >
                        <Upload className="text-white" size={20} />
                    </button>
                </div>
                <div className="flex-1 space-y-1">
                    <Text size="sm" variant="muted">
                        Upload an image to be displayed next to the role name.
                    </Text>

                    <input
                        accept=".png,.jpg,.jpeg,.webp,.gif"
                        aria-label="Upload role icon"
                        className="hidden"
                        id="role-icon-upload"
                        type="file"
                        onChange={onIconSelect}
                    />
                </div>
            </div>
        </div>

        <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Text weight="semibold">Role Glow</Text>
                    <br />
                    <Text size="xs" variant="muted">
                        Adds a glowing effect to the role color.
                    </Text>
                </div>
                <Toggle checked={glowEnabled} onCheckedChange={onChangeGlow} />
            </div>
        </div>

        <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Text weight="semibold">Separate Role from Group</Text>
                    <br />
                    <Text size="xs" variant="muted">
                        Display role members separately from online members.
                    </Text>
                </div>
                <Toggle
                    checked={separateFromOtherRoles}
                    onCheckedChange={onChangeSeparate}
                />
            </div>
        </div>
    </>
);
