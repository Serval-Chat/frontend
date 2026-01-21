import React, { useState } from 'react';

import { Plus, X } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';

import { useMe, useUpdateStyle } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useTheme } from '@/providers/ThemeProvider';
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
    const { theme, setTheme } = useTheme();

    // Local state
    const [glowEnabled, setGlowEnabled] = useState(
        user.usernameGlow?.enabled ?? false,
    );
    const [gradientEnabled, setGradientEnabled] = useState(
        user.usernameGradient?.enabled ?? false,
    );
    const [gradientColors, setGradientColors] = useState<
        { id: string; value: string }[]
    >(() =>
        (user.usernameGradient?.colors || []).map((c) => ({
            id: Math.random().toString(36),
            value: c,
        })),
    );
    const [gradientAngle, setGradientAngle] = useState(
        user.usernameGradient?.angle ?? 90,
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
            })),
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
            color: user.usernameGlow?.color,
            intensity: user.usernameGlow?.intensity ?? 5,
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
                    {/* Theme Settings */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-[var(--color-foreground)]">
                            Theme
                        </h4>
                        <div className="flex flex-wrap gap-4">
                            {[
                                { id: 'serval', label: 'Serval' },
                                { id: 'dark', label: 'Dark' },
                                { id: 'light', label: 'Light' },
                                { id: 'high-contrast', label: 'High Contrast' },
                            ].map((t) => (
                                <button
                                    className={`group flex items-center gap-3 p-3 rounded-xl border-2 transition-all theme-${
                                        t.id
                                    } ${
                                        theme === t.id
                                            ? 'border-[var(--color-primary)] bg-[var(--color-bg-secondary)]'
                                            : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] hover:border-[var(--color-border)]'
                                    }`}
                                    key={t.id}
                                    onClick={() => setTheme(t.id as any)}
                                >
                                    <div className="flex flex-col gap-1 w-12 h-10 rounded-lg p-1.5 border border-white/10 bg-[var(--background)] overflow-hidden">
                                        <div className="w-full h-2 rounded-sm bg-[var(--primary)]" />
                                        <div className="w-2/3 h-1.5 rounded-sm bg-[var(--foreground)] opacity-20" />
                                        <div className="w-1/2 h-1.5 rounded-sm bg-[var(--foreground)] opacity-10" />
                                    </div>
                                    <div className="flex flex-col items-start pr-2">
                                        <span
                                            className={`text-sm font-bold ${
                                                theme === t.id
                                                    ? 'text-[var(--color-primary)]'
                                                    : 'text-[var(--color-foreground)]'
                                            }`}
                                        >
                                            {t.label}
                                        </span>
                                        <div className="flex gap-1 mt-1">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]"
                                                title="Primary"
                                            />
                                            <div
                                                className="w-2.5 h-2.5 rounded-full bg-[var(--primary-muted)]"
                                                title="Primary Muted"
                                            />
                                            <div
                                                className="w-2.5 h-2.5 rounded-full bg-[var(--success)]"
                                                title="Success"
                                            />
                                            <div
                                                className="w-2.5 h-2.5 rounded-full bg-[var(--danger)]"
                                                title="Danger"
                                            />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

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
                                                                      },
                                                            )
                                                        }
                                                    />
                                                    <button
                                                        className="absolute -top-1 -right-1 bg-[var(--color-danger)] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() =>
                                                            removeGradientColor(
                                                                index,
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
                                                                            null,
                                                                        )
                                                                    }
                                                                    onKeyDown={(
                                                                        e,
                                                                    ) => {
                                                                        if (
                                                                            e.key ===
                                                                            'Escape'
                                                                        )
                                                                            setActiveColorPicker(
                                                                                null,
                                                                            );
                                                                    }}
                                                                />
                                                                <div className="relative shadow-xl rounded-lg overflow-hidden">
                                                                    <HexColorPicker
                                                                        color={
                                                                            colorItem.value
                                                                        }
                                                                        onChange={(
                                                                            c,
                                                                        ) =>
                                                                            updateGradientColor(
                                                                                index,
                                                                                c,
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>
                                            ),
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
                                                        Number(e.target.value),
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
    return <AppearanceSettingsForm key={user._id} user={user} />;
};
