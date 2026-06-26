import { type ChangeEvent, useRef, useState } from 'react';

import { Download, Plus, Trash2, Upload, X } from 'lucide-react';
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
import { Modal } from '@/ui/components/common/Modal';
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

const validateCustomThemeCss = (css: string): string | null => {
    const openBraces = (css.match(/{/g) ?? []).length;
    const closeBraces = (css.match(/}/g) ?? []).length;

    if (openBraces !== closeBraces) {
        return 'CSS has mismatched braces.';
    }

    if (!css.includes('data-custom-theme')) {
        return 'Include the data-custom-theme selector from the example CSS.';
    }

    if (!/--(?:background|foreground|primary)\s*:/i.test(css)) {
        return 'Define at least one theme color variable.';
    }

    if ('CSSStyleSheet' in window) {
        try {
            new CSSStyleSheet().replaceSync(css);
        } catch {
            return 'CSS could not be parsed. Check for syntax errors.';
        }
    }

    return null;
};

const AppearanceSettingsForm = ({ user }: AppearanceSettingsFormProps) => {
    const { showToast } = useToast();
    const { mutate: updateStyle, isPending: isUpdatingStyle } =
        useUpdateStyle();
    const { mutate: updateSettings, isPending: isUpdatingSettings } =
        useUpdateSettings();
    const isPending = isUpdatingStyle || isUpdatingSettings;

    const {
        customThemes,
        deleteCustomTheme,
        saveCustomTheme,
        setCustomFontUrl,
        setCustomFontFamily,
        setTheme,
        theme,
    } = useTheme();

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
    const [editingThemeId, setEditingThemeId] = useState<string | undefined>();
    const [pendingDeleteThemeId, setPendingDeleteThemeId] = useState<
        string | undefined
    >();
    const [customThemeName, setCustomThemeName] = useState('');
    const [customThemeCss, setCustomThemeCss] = useState('');
    const [customThemeFileName, setCustomThemeFileName] = useState('');
    const customThemeFileInputRef = useRef<HTMLInputElement>(null);

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
    const [hexDraft, setHexDraft] = useState('');
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

    const handleSaveCustomTheme = (): void => {
        const trimmedName = customThemeName.trim();
        if (!trimmedName) {
            showToast('Give your CSS theme a name first', 'error');
            return;
        }

        if (!customThemeCss.trim()) {
            showToast('Paste some CSS before saving the theme', 'error');
            return;
        }

        const validationError = validateCustomThemeCss(customThemeCss);
        if (validationError) {
            showToast(validationError, 'error');
            return;
        }

        const savedTheme = saveCustomTheme({
            id: editingThemeId,
            name: trimmedName,
            css: customThemeCss,
        });

        setEditingThemeId(savedTheme.id);
        setCustomThemeCss(savedTheme.sourceCss);
        setTheme(`custom:${savedTheme.id}`);
        showToast('Custom theme saved', 'success');
    };

    const handleEditCustomTheme = (customThemeId: string): void => {
        const customTheme = customThemes.find(
            (candidate): boolean => candidate.id === customThemeId,
        );
        if (!customTheme) return;

        setEditingThemeId(customTheme.id);
        setCustomThemeName(customTheme.name);
        setCustomThemeCss(customTheme.sourceCss);
        setCustomThemeFileName(`${customTheme.name}.css`);
    };

    const handleNewCustomTheme = (): void => {
        setEditingThemeId(undefined);
        setCustomThemeName('');
        setCustomThemeCss('');
        setCustomThemeFileName('');
    };

    const handleDownloadCustomTheme = (name: string, css: string): void => {
        const fileName = `${
            name
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '') || 'serchat-theme'
        }.css`;
        const url = URL.createObjectURL(
            new Blob([css], { type: 'text/css;charset=utf-8' }),
        );
        const link = document.createElement('a');

        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleConfirmDeleteCustomTheme = (): void => {
        if (!pendingDeleteThemeId) return;

        const deletedTheme = customThemes.find(
            (customTheme): boolean => customTheme.id === pendingDeleteThemeId,
        );

        deleteCustomTheme(pendingDeleteThemeId);

        if (editingThemeId === pendingDeleteThemeId) {
            handleNewCustomTheme();
        }

        setPendingDeleteThemeId(undefined);
        showToast(
            deletedTheme
                ? `Deleted ${deletedTheme.name}`
                : 'Custom theme deleted',
            'success',
        );
    };

    const handleCustomThemeFileChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.css')) {
            showToast('Please upload a .css file', 'error');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (): void => {
            const css = typeof reader.result === 'string' ? reader.result : '';
            const fallbackName = file.name.replace(/\.css$/i, '');

            setEditingThemeId(undefined);
            setCustomThemeName(fallbackName);
            setCustomThemeCss(css);
            setCustomThemeFileName(file.name);
        };
        reader.onerror = (): void => {
            showToast('Could not read that CSS file', 'error');
        };
        reader.readAsText(file);
        event.target.value = '';
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
        if (gradientColors.length < 20) {
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

    const pendingDeleteTheme = customThemes.find(
        (customTheme): boolean => customTheme.id === pendingDeleteThemeId,
    );

    return (
        <>
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
                                {user.displayName || user.username}
                            </StyledUserName>
                        </div>
                    </div>

                    <div className="flex flex-col gap-8">
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
                                            Colors (Max 20)
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
                                                            onClick={(
                                                                e,
                                                            ): void => {
                                                                triggerRef.current =
                                                                    e.currentTarget;
                                                                const isOpen =
                                                                    activeColorPicker?.type ===
                                                                        'gradient' &&
                                                                    activeColorPicker.index ===
                                                                        index;
                                                                setActiveColorPicker(
                                                                    isOpen
                                                                        ? null
                                                                        : {
                                                                              type: 'gradient',
                                                                              index,
                                                                          },
                                                                );
                                                                if (!isOpen)
                                                                    setHexDraft(
                                                                        colorItem.value,
                                                                    );
                                                            }}
                                                        >
                                                            <span className="sr-only">
                                                                Select color{' '}
                                                                {
                                                                    colorItem.value
                                                                }
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
                                                                    className="z-top"
                                                                    ref={
                                                                        pickerRef
                                                                    }
                                                                    style={{
                                                                        position:
                                                                            'fixed',
                                                                        left: pickerCoords.x,
                                                                        top: pickerCoords.y,
                                                                    }}
                                                                >
                                                                    <button
                                                                        aria-label="Close color picker"
                                                                        className="fixed inset-0"
                                                                        tabIndex={
                                                                            -1
                                                                        }
                                                                        type="button"
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
                                                                    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-background shadow-xl">
                                                                        <HexColorPicker
                                                                            color={
                                                                                colorItem.value
                                                                            }
                                                                            onChange={(
                                                                                c,
                                                                            ): void => {
                                                                                updateGradientColor(
                                                                                    index,
                                                                                    c,
                                                                                );
                                                                                setHexDraft(
                                                                                    c,
                                                                                );
                                                                            }}
                                                                        />
                                                                        <div className="flex items-center gap-2 bg-bg-secondary px-3 py-2">
                                                                            <span className="font-mono text-xs text-muted-foreground select-none">
                                                                                #
                                                                            </span>
                                                                            <input
                                                                                aria-label="Hex color value"
                                                                                className="w-full bg-transparent font-mono text-xs text-foreground outline-none"
                                                                                maxLength={
                                                                                    6
                                                                                }
                                                                                spellCheck={
                                                                                    false
                                                                                }
                                                                                type="text"
                                                                                value={hexDraft.replace(
                                                                                    /^#/,
                                                                                    '',
                                                                                )}
                                                                                onChange={(
                                                                                    e,
                                                                                ): void => {
                                                                                    const raw =
                                                                                        e.target.value.replace(
                                                                                            /[^0-9a-fA-F]/g,
                                                                                            '',
                                                                                        );
                                                                                    setHexDraft(
                                                                                        `#${raw}`,
                                                                                    );
                                                                                    if (
                                                                                        raw.length ===
                                                                                        6
                                                                                    )
                                                                                        updateGradientColor(
                                                                                            index,
                                                                                            `#${raw}`,
                                                                                        );
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>,
                                                                document.body,
                                                            )}
                                                    </div>
                                                ),
                                            )}
                                            {gradientColors.length < 20 && (
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
                                                    aria-label="Gradient angle"
                                                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-bg-secondary accent-primary"
                                                    max={360}
                                                    min={0}
                                                    type="range"
                                                    value={gradientAngle}
                                                    onChange={(e): void =>
                                                        setGradientAngle(
                                                            Number(
                                                                e.target.value,
                                                            ),
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

                        {/* Theme Settings */}
                        <div className="space-y-4">
                            <Heading level={4}>Theme</Heading>
                            <ThemeSwitcher />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <Heading level={4}>
                                        Custom CSS Themes
                                    </Heading>
                                    <span className="text-sm text-muted-foreground">
                                        Saved CSS is stored locally in this
                                        browser and injected when selected.
                                    </span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleNewCustomTheme}
                                >
                                    New CSS Theme
                                </Button>
                            </div>

                            {customThemes.length > 0 && (
                                <div className="grid grid-cols-1 gap-2">
                                    {customThemes.map((customTheme) => (
                                        <div
                                            className="flex items-start justify-between gap-3 rounded-md border border-border-subtle bg-bg-subtle p-3"
                                            key={customTheme.id}
                                        >
                                            <button
                                                className="min-w-0 flex-1 text-left"
                                                type="button"
                                                onClick={(): void =>
                                                    handleEditCustomTheme(
                                                        customTheme.id,
                                                    )
                                                }
                                            >
                                                <span className="block truncate text-sm font-bold text-foreground">
                                                    {customTheme.name}
                                                </span>
                                                {customTheme.metadata
                                                    ?.author && (
                                                    <span className="block text-xs text-muted-foreground">
                                                        by{' '}
                                                        {
                                                            customTheme.metadata
                                                                .author
                                                        }
                                                    </span>
                                                )}
                                                {customTheme.metadata
                                                    ?.description && (
                                                    <span className="mt-1 block text-xs text-muted-foreground">
                                                        {
                                                            customTheme.metadata
                                                                .description
                                                        }
                                                    </span>
                                                )}
                                                <span className="mt-1 block text-xs text-muted-foreground">
                                                    {theme ===
                                                    `custom:${customTheme.id}`
                                                        ? '✓ Active'
                                                        : 'Saved locally'}
                                                </span>
                                            </button>
                                            <div className="flex flex-col gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(): void =>
                                                        setTheme(
                                                            `custom:${customTheme.id}`,
                                                        )
                                                    }
                                                >
                                                    Use
                                                </Button>
                                                <Button
                                                    className="min-w-0 px-2"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(): void =>
                                                        handleDownloadCustomTheme(
                                                            customTheme.name,
                                                            customTheme.sourceCss,
                                                        )
                                                    }
                                                >
                                                    <Download size={16} />
                                                </Button>
                                                <Button
                                                    className="min-w-0 px-2"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(): void =>
                                                        setPendingDeleteThemeId(
                                                            customTheme.id,
                                                        )
                                                    }
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-3 rounded-lg border border-border-subtle bg-bg-subtle p-4">
                                <input
                                    accept=".css,text/css"
                                    aria-label="Upload custom theme CSS"
                                    className="hidden"
                                    ref={customThemeFileInputRef}
                                    type="file"
                                    onChange={handleCustomThemeFileChange}
                                />
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <span className="block text-xs font-bold text-muted-foreground uppercase">
                                            CSS Theme File
                                        </span>
                                        <span className="block truncate text-sm text-foreground">
                                            {customThemeFileName ||
                                                'No CSS file selected'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            icon={Download}
                                            size="sm"
                                            variant="ghost"
                                            onClick={(): void => {
                                                const link =
                                                    document.createElement('a');
                                                link.href = '/example.css';
                                                link.download = 'example.css';
                                                link.click();
                                            }}
                                        >
                                            Example CSS
                                        </Button>
                                        <Button
                                            icon={Upload}
                                            size="sm"
                                            variant="ghost"
                                            onClick={(): void =>
                                                customThemeFileInputRef.current?.click()
                                            }
                                        >
                                            Upload CSS
                                        </Button>
                                    </div>
                                </div>
                                <label
                                    className="text-xs font-bold text-muted-foreground uppercase"
                                    htmlFor="custom-theme-name"
                                >
                                    Theme Name
                                </label>
                                <input
                                    className="w-full rounded-md border border-border-subtle bg-bg-secondary px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                    id="custom-theme-name"
                                    placeholder="My Serchat Theme"
                                    type="text"
                                    value={customThemeName}
                                    onChange={(e): void =>
                                        setCustomThemeName(e.target.value)
                                    }
                                />
                                <label
                                    className="text-xs font-bold text-muted-foreground uppercase"
                                    htmlFor="custom-theme-css"
                                >
                                    CSS
                                </label>
                                <textarea
                                    className="custom-scrollbar min-h-64 w-full resize-y rounded-md border border-border-subtle bg-bg-secondary px-3 py-2 font-mono text-sm leading-6 text-foreground focus:border-primary focus:outline-none"
                                    id="custom-theme-css"
                                    placeholder="[data-custom-theme] {&#10;  --background: #101014;&#10;  --foreground: #f4f4f5;&#10;  --primary: #7cdbff;&#10;}"
                                    spellCheck={false}
                                    value={customThemeCss}
                                    onChange={(e): void =>
                                        setCustomThemeCss(e.target.value)
                                    }
                                />
                                <div className="flex flex-wrap justify-end gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleNewCustomTheme}
                                    >
                                        Clear
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={handleSaveCustomTheme}
                                    >
                                        {editingThemeId
                                            ? 'Save CSS Theme'
                                            : 'Add CSS Theme'}
                                    </Button>
                                </div>
                            </div>
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
                                    Apply a custom font by providing a Google
                                    APIs link to the font.
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
                                                (val as UsernameFont) ||
                                                    'default',
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
            <Modal
                isOpen={!!pendingDeleteThemeId}
                title="Delete Custom Theme"
                onClose={(): void => setPendingDeleteThemeId(undefined)}
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Delete{' '}
                        <span className="font-bold text-foreground">
                            {pendingDeleteTheme?.name ?? 'this custom theme'}
                        </span>
                        ? This removes the locally saved CSS from this browser.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={(): void =>
                                setPendingDeleteThemeId(undefined)
                            }
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            variant="danger"
                            onClick={handleConfirmDeleteCustomTheme}
                        >
                            Delete Theme
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export const AppearanceSettings = () => {
    const { data: user } = useMe();
    if (!user) return null;
    return <AppearanceSettingsForm key={user.id} user={user} />;
};
