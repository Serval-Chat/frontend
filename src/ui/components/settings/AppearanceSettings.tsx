import React, { useState } from 'react';

import { Plus, X } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';

import { useMe, useUpdateStyle } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { Button } from '@/ui/components/common/Button';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { Toggle } from '@/ui/components/common/Toggle';

interface AppearanceSettingsFormProps {
    user: User;
}

const AppearanceSettingsForm: React.FC<AppearanceSettingsFormProps> = ({
    user,
}) => {
    const { mutate: updateStyle, isPending } = useUpdateStyle();

    // Local state
    const [glowEnabled, setGlowEnabled] = useState(
        user.usernameGlow?.enabled ?? false
    );
    const [gradientEnabled, setGradientEnabled] = useState(
        user.usernameGradient?.enabled ?? false
    );
    const [gradientColors, setGradientColors] = useState<
        { id: string; value: string }[]
    >(() =>
        (user.usernameGradient?.colors || []).map((c) => ({
            id: Math.random().toString(36),
            value: c,
        }))
    );
    const [gradientAngle, setGradientAngle] = useState(
        user.usernameGradient?.angle ?? 90
    );

    // Track changes
    const hasChanges =
        glowEnabled !== (user.usernameGlow?.enabled ?? false) ||
        gradientEnabled !== (user.usernameGradient?.enabled ?? false) ||
        JSON.stringify(gradientColors.map((c) => c.value)) !==
            JSON.stringify(user.usernameGradient?.colors || []) ||
        gradientAngle !== (user.usernameGradient?.angle ?? 90);

    const handleSave = (): void => {
        updateStyle({
            usernameGlow: {
                enabled: glowEnabled,
                color: user.usernameGlow?.color || '#ffffff', // Required by DTO but ignored by our logic
                intensity: user.usernameGlow?.intensity ?? 5,
            },
            usernameGradient: {
                enabled: gradientEnabled,
                colors: gradientColors.map((c) => c.value),
                angle: gradientAngle,
            },
        });
    };

    const handleReset = (): void => {
        setGlowEnabled(user.usernameGlow?.enabled ?? false);
        setGradientEnabled(user.usernameGradient?.enabled ?? false);
        setGradientColors(
            (user.usernameGradient?.colors || []).map((c) => ({
                id: Math.random().toString(36),
                value: c,
            }))
        );
        setGradientAngle(user.usernameGradient?.angle ?? 90);
    };

    // Color picker helpers
    const [activeColorPicker, setActiveColorPicker] = useState<{
        type: 'glow' | 'gradient';
        index?: number;
    } | null>(null);

    const previewUser = {
        ...user,
        usernameGlow: {
            enabled: glowEnabled,
            color: user.usernameGlow?.color, // Ensure compatibility with User type
            intensity: user.usernameGlow?.intensity,
        },
        usernameGradient: {
            enabled: gradientEnabled,
            colors: gradientColors.map((c) => c.value),
            angle: gradientAngle,
        },
    };

    const addGradientColor = (): void => {
        if (gradientColors.length < 2) {
            setGradientColors([
                ...gradientColors,
                { id: Math.random().toString(36), value: '#ff0000' },
            ]);
        }
    };

    const removeGradientColor = (index: number): void => {
        const newColors = [...gradientColors];
        newColors.splice(index, 1);
        setGradientColors(newColors);
    };

    const updateGradientColor = (index: number, color: string): void => {
        const newColors = [...gradientColors];
        newColors[index].value = color;
        setGradientColors(newColors);
    };

    return (
        <div className="max-w-3xl pb-20">
            <h3 className="text-xl font-bold text-[var(--color-foreground)] mb-6">
                Appearance
            </h3>

            <div className="grid grid-cols-1 gap-8">
                {/* Preview Section */}
                <div className="bg-[var(--color-bg-subtle)] p-6 rounded-lg text-center">
                    <h4 className="text-sm font-bold text-[var(--color-muted-foreground)] uppercase mb-4">
                        Preview
                    </h4>
                    <div className="flex justify-center items-center py-4 bg-[var(--color-bg-secondary)] rounded border border-[var(--color-border-subtle)]">
                        <StyledUserName
                            className="text-3xl font-bold"
                            disableCustomFonts={false}
                            user={previewUser}
                        >
                            {user.username}
                        </StyledUserName>
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                    {/* Glow Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold text-[var(--color-foreground)]">
                                Username Glow
                            </h4>
                            <Toggle
                                checked={glowEnabled}
                                onCheckedChange={setGlowEnabled}
                            />
                        </div>
                    </div>

                    {/* Gradient Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold text-[var(--color-foreground)]">
                                Username Gradient
                            </h4>
                            <Toggle
                                checked={gradientEnabled}
                                onCheckedChange={setGradientEnabled}
                            />
                        </div>

                        {gradientEnabled && (
                            <div className="p-4 border border-[var(--color-border-subtle)] rounded-lg bg-[var(--color-bg-subtle)] space-y-4">
                                <div>
                                    <span className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-2">
                                        Colors (Max 2)
                                    </span>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {gradientColors.map(
                                            (colorItem, index) => (
                                                <div
                                                    className="relative group"
                                                    key={colorItem.id}
                                                >
                                                    <button
                                                        className="w-10 h-10 rounded-full border-2 border-[var(--color-border)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                                        style={{
                                                            backgroundColor:
                                                                colorItem.value,
                                                        }}
                                                        onClick={() =>
                                                            setActiveColorPicker(
                                                                activeColorPicker?.type ===
                                                                    'gradient' &&
                                                                    activeColorPicker.index ===
                                                                        index
                                                                    ? null
                                                                    : {
                                                                          type: 'gradient',
                                                                          index,
                                                                      }
                                                            )
                                                        }
                                                    />
                                                    <button
                                                        className="absolute -top-1 -right-1 bg-[var(--color-danger)] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() =>
                                                            removeGradientColor(
                                                                index
                                                            )
                                                        }
                                                    >
                                                        <X size={10} />
                                                    </button>

                                                    {activeColorPicker?.type ===
                                                        'gradient' &&
                                                        activeColorPicker.index ===
                                                            index && (
                                                            <div className="absolute top-12 left-0 z-dropdown">
                                                                <div
                                                                    aria-label="Close color picker"
                                                                    className="fixed inset-0"
                                                                    role="button"
                                                                    tabIndex={
                                                                        -1
                                                                    }
                                                                    onClick={() =>
                                                                        setActiveColorPicker(
                                                                            null
                                                                        )
                                                                    }
                                                                    onKeyDown={(
                                                                        e
                                                                    ) => {
                                                                        if (
                                                                            e.key ===
                                                                            'Escape'
                                                                        )
                                                                            setActiveColorPicker(
                                                                                null
                                                                            );
                                                                    }}
                                                                />
                                                                <div className="relative shadow-xl rounded-lg overflow-hidden">
                                                                    <HexColorPicker
                                                                        color={
                                                                            colorItem.value
                                                                        }
                                                                        onChange={(
                                                                            c
                                                                        ) =>
                                                                            updateGradientColor(
                                                                                index,
                                                                                c
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>
                                            )
                                        )}
                                        {gradientColors.length < 2 && (
                                            <button
                                                className="w-10 h-10 rounded-full border-2 border-[var(--color-border)] border-dashed flex items-center justify-center text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors"
                                                onClick={addGradientColor}
                                            >
                                                <Plus size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <span className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-2">
                                            Angle (Deg)
                                        </span>
                                        <div className="flex items-center gap-4">
                                            <input
                                                className="flex-1 accent-[var(--color-primary)] h-1.5 bg-[var(--color-bg-secondary)] rounded-lg appearance-none cursor-pointer"
                                                max={360}
                                                min={0}
                                                type="range"
                                                value={gradientAngle}
                                                onChange={(e) =>
                                                    setGradientAngle(
                                                        Number(e.target.value)
                                                    )
                                                }
                                            />
                                            <span className="text-sm font-medium text-[var(--color-foreground)] min-w-[3ch]">
                                                {gradientAngle}°
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {hasChanges && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-subtle)] flex justify-end gap-3 items-center z-fixed md:absolute md:rounded-b-lg">
                    <span className="text-sm text-[var(--color-foreground)] mr-auto">
                        Careful - you have unsaved changes!
                    </span>
                    <Button variant="ghost" onClick={handleReset}>
                        Reset
                    </Button>
                    <Button
                        loading={isPending}
                        variant="success"
                        onClick={handleSave}
                    >
                        Save Changes
                    </Button>
                </div>
            )}
        </div>
    );
};

export const AppearanceSettings: React.FC = () => {
    const { data: user } = useMe();
    if (!user) return null;
    return (
        <AppearanceSettingsForm
            key={user.updatedAt?.toString() || user._id}
            user={user}
        />
    );
};
