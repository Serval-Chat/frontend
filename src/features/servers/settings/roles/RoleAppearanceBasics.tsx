import React from 'react';

import { Image as ImageIcon, Upload } from 'lucide-react';

import { FileInput } from '@/ui/primitives/FileInput';
import { Label } from '@/ui/primitives/Label';
import { Pressable } from '@/ui/primitives/Pressable';
import { Text } from '@/ui/primitives/Text';
import { Toggle } from '@/ui/primitives/Toggle';

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
            <Label htmlFor="roleIcon">Role Icon</Label>
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
                    <Pressable
                        aria-label="Upload role icon"
                        className="absolute inset-0 flex h-full w-full cursor-pointer items-center justify-center border-none bg-black/50 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(): void | undefined =>
                            (
                                document.querySelector(
                                    '#role-icon-upload',
                                ) as HTMLElement | null
                            )?.click()
                        }
                    >
                        <Upload className="text-white" size={20} />
                    </Pressable>
                </div>
                <div className="flex-1 space-y-1">
                    <Text size="sm" variant="muted">
                        Upload an image to be displayed next to the role name.
                    </Text>

                    <FileInput
                        accept=".png,.jpg,.jpeg,.webp,.gif"
                        aria-label="Upload role icon"
                        id="role-icon-upload"
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
