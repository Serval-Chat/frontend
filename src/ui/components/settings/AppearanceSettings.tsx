import { useRef, useState } from 'react';

import { Plus, X } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { createPortal } from 'react-dom';

import {
    useMe,
    useUpdateSettings,
    useUpdateStyle,
} from '@/api/users/users.queries';
import type { User, UsernameFont } from '@/api/users/users.types';
import { useSmartPosition } from '@/hooks/useSmartPosition';
import { useTheme } from '@/providers/ThemeProvider';
import { Button } from '@/ui/components/common/Button';
import { DropdownWithSearch } from '@/ui/components/common/DropdownWithSearch';
import { Heading } from '@/ui/components/common/Heading';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { useToast } from '@/ui/components/common/Toast';
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

const AppearanceSettingsForm = ({ user }: AppearanceSettingsFormProps) => {
    const { showToast } = useToast();
    const { mutate: updateStyle, isPending: isUpdatingStyle } =
        useUpdateStyle();
    const { mutate: updateSettings, isPending: isUpdatingSettings } =
        useUpdateSettings();
    const isPending = isUpdatingStyle || isUpdatingSettings;

    const { setCustomFontUrl, setCustomFontFamily } = useTheme();

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
    >((): { id: string; value: string }[] =>
        (user.usernameGradient?.colors || []).map(
            (c): { id: string; value: string } => ({
                id: Math.random().toString(36),
                value: c,
            }),
        ),
    );
    const [gradientAngle, setGradientAngle] = useState(
        user.usernameGradient?.angle ?? 90,
    );

    const [localCustomFontUrl, setLocalCustomFontUrl] = useState(
        user.settings?.customFontUrl ?? '',
    );
    const [localCustomFontFamily, setLocalCustomFontFamily] = useState(
        user.settings?.customFontFamily ?? '',
    );
    const [use24HourTime, setUse24HourTime] = useState(
        user.settings?.use24HourTime ?? false,
    );

    // Track changes
    const hasChanges =
        usernameFont !== (user.usernameFont ?? 'default') ||
        glowEnabled !== (user.usernameGlow?.enabled ?? false) ||
        gradientEnabled !== (user.usernameGradient?.enabled ?? false) ||
        JSON.stringify(gradientColors.map((c): string => c.value)) !==
            JSON.stringify(user.usernameGradient?.colors || []) ||
        gradientAngle !== (user.usernameGradient?.angle ?? 90) ||
        localCustomFontUrl !== (user.settings?.customFontUrl ?? '') ||
        localCustomFontFamily !== (user.settings?.customFontFamily ?? '') ||
        use24HourTime !== (user.settings?.use24HourTime ?? false);

    const handleSave = (): void => {
        if (localCustomFontUrl) {
            const googleFontRegex =
                /^https:\/\/fonts\.googleapis\.com\/css2\?family=[^<>\s]+$/;
            if (!googleFontRegex.test(localCustomFontUrl)) {
                showToast('Please enter a valid Google Fonts URL', 'error');
                return;
            }
        }

        updateStyle({
            usernameFont: usernameFont,
            usernameGlow: {
                enabled: glowEnabled,
                color: user.usernameGlow?.color || '#ffffff', // Required by DTO but ignored by our logic
                intensity: user.usernameGlow?.intensity ?? 5,
            },
            usernameGradient: {
                enabled: gradientEnabled,
                colors: gradientColors.map((c): string => c.value),
                angle: gradientAngle,
            },
        });

        if (
            localCustomFontUrl !== (user.settings?.customFontUrl ?? '') ||
            localCustomFontFamily !== (user.settings?.customFontFamily ?? '') ||
            use24HourTime !== (user.settings?.use24HourTime ?? false)
        ) {
            updateSettings({
                customFontUrl: localCustomFontUrl,
                customFontFamily: localCustomFontFamily,
                use24HourTime,
            });
        }

        setCustomFontUrl(localCustomFontUrl);
        setCustomFontFamily(localCustomFontFamily);
    };

    const handleReset = (): void => {
        setUsernameFont(user.usernameFont ?? 'default');
        setGlowEnabled(user.usernameGlow?.enabled ?? false);
        setGradientEnabled(user.usernameGradient?.enabled ?? false);
        setGradientColors(
            (user.usernameGradient?.colors || []).map(
                (c): { id: string; value: string } => ({
                    id: Math.random().toString(36),
                    value: c,
                }),
            ),
        );
        setGradientAngle(user.usernameGradient?.angle ?? 90);
        setLocalCustomFontUrl(user.settings?.customFontUrl ?? '');
        setLocalCustomFontFamily(user.settings?.customFontFamily ?? '');
        setUse24HourTime(user.settings?.use24HourTime ?? false);
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
        setLocalCustomFontUrl('');
        setLocalCustomFontFamily('');
        setUse24HourTime(false);
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
            colors: gradientColors.map((c): string => c.value),
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

                    {/* Message Display Settings */}
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <Heading level={4}>24-Hour Time</Heading>
                                <Toggle
                                    checked={use24HourTime}
                                    onCheckedChange={setUse24HourTime}
                                />
                            </div>
                            <span className="text-sm text-muted-foreground">
                                Show message timestamps in 24-hour format.
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <Heading level={4}>Global Font</Heading>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(): void => {
                                        setLocalCustomFontUrl('');
                                        setLocalCustomFontFamily('');
                                    }}
                                >
                                    Reset to Default
                                </Button>
                            </div>
                            <span className="text-sm text-muted-foreground">
                                Apply a custom font by providing a Google APIs
                                link to the font.
                            </span>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label
                                        className="text-xs font-bold text-muted-foreground uppercase"
                                        htmlFor="custom-font-url"
                                    >
                                        Google Font CDN URL
                                    </label>
                                    <input
                                        className="w-full rounded-md border border-border-subtle bg-bg-secondary px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                        id="custom-font-url"
                                        placeholder="https://fonts.googleapis.com/css2?family=..."
                                        type="text"
                                        value={localCustomFontUrl}
                                        onChange={(e): void =>
                                            setLocalCustomFontUrl(
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label
                                        className="text-xs font-bold text-muted-foreground uppercase"
                                        htmlFor="custom-font-family"
                                    >
                                        Font Family Name
                                    </label>
                                    <input
                                        className="w-full rounded-md border border-border-subtle bg-bg-secondary px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                        id="custom-font-family"
                                        placeholder="e.g. Open Sans"
                                        type="text"
                                        value={localCustomFontFamily}
                                        onChange={(e): void =>
                                            setLocalCustomFontFamily(
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </div>
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
                                    onChange={(val): void => {
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
                                                        onClick={(e): void => {
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
                                                        onClick={(): void =>
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
                                                                    onClick={(): void =>
                                                                        setActiveColorPicker(
                                                                            null,
                                                                        )
                                                                    }
                                                                    onKeyDown={(
                                                                        e,
                                                                    ): void => {
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
                                                                        ): void =>
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
                                                onChange={(e): void =>
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

export const AppearanceSettings = () => {
    const { data: user } = useMe();
    if (!user) return null;
    return <AppearanceSettingsForm key={user._id} user={user} />;
};
