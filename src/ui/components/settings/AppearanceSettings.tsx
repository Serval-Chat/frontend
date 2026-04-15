import React, { useRef, useState } from 'react';

import { Plus, X } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { createPortal } from 'react-dom';

import { useMe, useUpdateStyle } from '@/api/users/users.queries';
import type { User, UsernameFont } from '@/api/users/users.types';
import { useSmartPosition } from '@/hooks/useSmartPosition';
import { Button } from '@/ui/components/common/Button';
import { DropdownWithSearch } from '@/ui/components/common/DropdownWithSearch';
import { Heading } from '@/ui/components/common/Heading';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { Toggle } from '@/ui/components/common/Toggle';

import { ThemeSwitcher } from './ThemeSwitcher';

const FONT_OPTIONS = [
    {
        id: 'default',
        label: 'Default (Noto Sans)',
        style: { fontFamily: 'default' },
    },
    { id: 'Audiowide', label: 'Audiowide', style: { fontFamily: 'Audiowide' } },
    {
        id: 'Bebas Neue',
        label: 'Bebas Neue',
        style: { fontFamily: 'Bebas Neue' },
    },
    {
        id: 'Betania Patmos',
        label: 'Betania Patmos',
        style: { fontFamily: 'Betania Patmos' },
    },
    {
        id: 'Google Sans Code',
        label: 'Google Sans Code',
        style: { fontFamily: 'Google Sans Code' },
    },
    { id: 'Noto Sans', label: 'Noto Sans', style: { fontFamily: 'Noto Sans' } },
    { id: 'Pacifico', label: 'Pacifico', style: { fontFamily: 'Pacifico' } },
    {
        id: 'Playpen Sans Deva',
        label: 'Playpen Sans Deva',
        style: { fontFamily: 'Playpen Sans Deva' },
    },
    {
        id: 'Rampart One',
        label: 'Rampart One',
        style: { fontFamily: 'Rampart One' },
    },
    { id: 'Roboto', label: 'Roboto', style: { fontFamily: 'Roboto' } },
    { id: 'Workbench', label: 'Workbench', style: { fontFamily: 'Workbench' } },
];

interface AppearanceSettingsFormProps {
    user: User;
}

const AppearanceSettingsForm: React.FC<AppearanceSettingsFormProps> = ({
    user,
}) => {
    const { mutate: updateStyle, isPending } = useUpdateStyle();

    // Local state
    const [usernameFont, setUsernameFont] = useState<UsernameFont>(
        user.usernameFont ?? 'default',
    );
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
        usernameFont !== (user.usernameFont ?? 'default') ||
        glowEnabled !== (user.usernameGlow?.enabled ?? false) ||
        gradientEnabled !== (user.usernameGradient?.enabled ?? false) ||
        JSON.stringify(gradientColors.map((c) => c.value)) !==
            JSON.stringify(user.usernameGradient?.colors || []) ||
        gradientAngle !== (user.usernameGradient?.angle ?? 90);

    const handleSave = (): void => {
        updateStyle({
            usernameFont: usernameFont,
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
        setUsernameFont(user.usernameFont ?? 'default');
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
    const pickerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);

    const pickerCoords = useSmartPosition({
        isOpen: !!activeColorPicker,
        elementRef: pickerRef,
        triggerRef,
        padding: 16,
        offset: 12,
    });

    const handleResetToDefaults = (): void => {
        setUsernameFont('default');
        setGlowEnabled(false);
        setGradientEnabled(false);
        setGradientColors([]);
        setGradientAngle(90);
    };

    const previewUser = {
        ...user,
        usernameFont: usernameFont !== 'default' ? usernameFont : undefined,
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
            <div className="mb-6 flex items-center justify-between">
                <Heading level={3}>Appearance</Heading>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleResetToDefaults}
                >
                    Reset all username styles
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Preview Section */}
                <div className="rounded-lg bg-bg-subtle p-6 text-center">
                    <Heading
                        className="mb-4 text-sm font-bold text-muted-foreground uppercase"
                        level={4}
                    >
                        Preview
                    </Heading>
                    <div className="flex items-center justify-center rounded border border-border-subtle bg-bg-secondary py-4">
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
                        <Heading level={4}>Theme</Heading>
                        <ThemeSwitcher />
                    </div>

                    {/* Font Settings */}
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <Heading level={4}>Username Font</Heading>
                            <span className="text-sm text-muted-foreground">
                                Select a custom font for your username alias
                                globally.
                            </span>
                            <div className="relative z-[var(--z-index-dropdown)] max-w-xs">
                                <DropdownWithSearch
                                    allowClear={false}
                                    options={FONT_OPTIONS.map((f) => ({
                                        ...f,
                                        label: f.label,
                                        displayLabel: (
                                            <span style={f.style}>
                                                {f.label}
                                            </span>
                                        ),
                                    }))}
                                    placeholder="Select Font"
                                    searchPlaceholder="Search fonts..."
                                    value={
                                        usernameFont === 'default'
                                            ? null
                                            : usernameFont
                                    }
                                    onChange={(val) => {
                                        setUsernameFont(
                                            (val as UsernameFont) || 'default',
                                        );
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Heading level={4}>Username Glow</Heading>
                            <Toggle
                                checked={glowEnabled}
                                onCheckedChange={setGlowEnabled}
                            />
                        </div>
                    </div>

                    {/* Gradient Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Heading level={4}>Username Gradient</Heading>
                            <Toggle
                                checked={gradientEnabled}
                                onCheckedChange={setGradientEnabled}
                            />
                        </div>

                        {gradientEnabled && (
                            <div className="space-y-4 rounded-lg border border-border-subtle bg-bg-subtle p-4">
                                <div>
                                    <span className="mb-2 block text-sm font-medium text-muted-foreground">
                                        Colors (Max 2)
                                    </span>
                                    <div className="mb-2 flex flex-wrap gap-2">
                                        {gradientColors.map(
                                            (colorItem, index) => (
                                                <div
                                                    className="group relative"
                                                    key={colorItem.id}
                                                >
                                                    <Button
                                                        className="border-border h-10 w-10 min-w-0 rounded-full border-2 p-0 shadow-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                        style={{
                                                            backgroundColor:
                                                                colorItem.value,
                                                        }}
                                                        variant="ghost"
                                                        onClick={(e) => {
                                                            triggerRef.current =
                                                                e.currentTarget;
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
                                                            );
                                                        }}
                                                    >
                                                        <span className="sr-only">
                                                            Select color{' '}
                                                            {colorItem.value}
                                                        </span>
                                                    </Button>
                                                    <Button
                                                        className="absolute -top-1 -right-1 h-4 w-4 min-w-0 rounded-full border-none bg-danger p-0.5 text-white opacity-0 shadow-none transition-opacity group-hover:opacity-100"
                                                        size="sm"
                                                        variant="primary"
                                                        onClick={() =>
                                                            removeGradientColor(
                                                                index,
                                                            )
                                                        }
                                                    >
                                                        <X size={10} />
                                                    </Button>

                                                    {activeColorPicker?.type ===
                                                        'gradient' &&
                                                        activeColorPicker.index ===
                                                            index &&
                                                        createPortal(
                                                            <div
                                                                className="z-[9999]"
                                                                ref={pickerRef}
                                                                style={{
                                                                    position:
                                                                        'fixed',
                                                                    left: pickerCoords.x,
                                                                    top: pickerCoords.y,
                                                                }}
                                                            >
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
                                                                <div className="relative overflow-hidden rounded-lg shadow-xl">
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
                                                            </div>,
                                                            document.body,
                                                        )}
                                                </div>
                                            ),
                                        )}
                                        {gradientColors.length < 2 && (
                                            <Button
                                                className="border-border flex h-10 w-10 min-w-0 items-center justify-center rounded-full border-2 border-dashed p-0 text-muted-foreground shadow-none transition-colors hover:border-primary hover:text-primary"
                                                variant="ghost"
                                                onClick={addGradientColor}
                                            >
                                                <Plus size={16} />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <span className="mb-2 block text-sm font-medium text-muted-foreground">
                                            Angle (Deg)
                                        </span>
                                        <div className="flex items-center gap-4">
                                            <input
                                                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-bg-secondary accent-primary"
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
                                            <span className="min-w-[3ch] text-sm font-medium text-foreground">
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

            <SettingsFloatingBar
                isFixed={false}
                isPending={isPending}
                isVisible={hasChanges}
                onReset={handleReset}
                onSave={handleSave}
            />
        </div>
    );
};

export const AppearanceSettings: React.FC = () => {
    const { data: user } = useMe();
    if (!user) return null;
    return <AppearanceSettingsForm key={user._id} user={user} />;
};
