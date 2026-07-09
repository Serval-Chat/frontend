import { type ChangeEvent, useReducer, useRef } from 'react';

import {
    useUpdateAppearance,
    useUpdateSettings,
    useUpdateStyle,
} from '@/api/users/users.queries';
import type { User, UsernameFont } from '@/api/users/users.types';
import { useSmartPosition } from '@/hooks/useSmartPosition';
import { useTheme } from '@/providers/ThemeProvider';
import { useToast } from '@/ui/components/common/Toast';
import { mergeReducer } from '@/utils/mergeReducer';

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
    if ('CSSStyleSheet' in globalThis) {
        try {
            new CSSStyleSheet().replaceSync(css);
        } catch {
            return 'CSS could not be parsed. Check for syntax errors.';
        }
    }
    return null;
};

interface AppearanceFormState {
    usernameFont: UsernameFont;
    glowEnabled: boolean;
    gradientEnabled: boolean;
    gradientColors: { id: string; value: string }[];
    gradientAngle: number;
    localCustomFontUrl: string;
    localCustomFontFamily: string;
    use24HourTime: boolean;
    profilePrimaryColor: string | null;
    originalProfilePrimaryColor: string | null;
    profileAccentColor: string | null;
    originalProfileAccentColor: string | null;
}

interface ThemeEditorState {
    editingThemeId?: string;
    pendingDeleteThemeId?: string;
    customThemeName: string;
    customThemeCss: string;
    customThemeFileName: string;
}

type ActivePicker = {
    type: 'glow' | 'gradient' | 'profilePrimary' | 'profileAccent';
    index?: number;
} | null;

const mapGradientColors = (
    colors: string[] | undefined,
): { id: string; value: string }[] =>
    (colors || []).map((c): { id: string; value: string } => ({
        id: Math.random().toString(36),
        value: c,
    }));

/**
 * owns all appearance-settings form state (username styling, profile colors,
 * fonts, custom CSS themes, transient color-picker UI) as grouped reducers,
 * plus every save / reset / custom-theme handler. Extracted from
 * AppearanceSettings so the view renders sections without carrying the logic.
 */
export const useAppearanceForm = (user: User) => {
    const { showToast } = useToast();
    const { mutate: updateStyle, isPending: isUpdatingStyle } =
        useUpdateStyle();
    const { mutate: updateSettings, isPending: isUpdatingSettings } =
        useUpdateSettings();
    const { mutate: updateAppearance, isPending: isUpdatingAppearance } =
        useUpdateAppearance();
    const isPending =
        isUpdatingStyle || isUpdatingSettings || isUpdatingAppearance;

    const {
        customThemes,
        deleteCustomTheme,
        saveCustomTheme,
        setCustomFontUrl,
        setCustomFontFamily,
        setTheme,
        theme,
    } = useTheme();

    const [form, patchForm] = useReducer(mergeReducer<AppearanceFormState>, {
        usernameFont: user.usernameFont ?? 'default',
        glowEnabled: user.usernameGlow?.enabled ?? false,
        gradientEnabled: user.usernameGradient?.enabled ?? false,
        gradientColors: mapGradientColors(user.usernameGradient?.colors),
        gradientAngle: user.usernameGradient?.angle ?? 90,
        localCustomFontUrl: user.settings?.customFontUrl ?? '',
        localCustomFontFamily: user.settings?.customFontFamily ?? '',
        use24HourTime: user.settings?.use24HourTime ?? false,
        profilePrimaryColor: user.profilePrimaryColor ?? null,
        originalProfilePrimaryColor: user.profilePrimaryColor ?? null,
        profileAccentColor: user.profileAccentColor ?? null,
        originalProfileAccentColor: user.profileAccentColor ?? null,
    });
    const {
        usernameFont,
        glowEnabled,
        gradientEnabled,
        gradientColors,
        gradientAngle,
        localCustomFontUrl,
        localCustomFontFamily,
        use24HourTime,
        profilePrimaryColor,
        originalProfilePrimaryColor,
        profileAccentColor,
        originalProfileAccentColor,
    } = form;

    const [themeEditor, patchTheme] = useReducer(
        mergeReducer<ThemeEditorState>,
        {
            editingThemeId: undefined,
            pendingDeleteThemeId: undefined,
            customThemeName: '',
            customThemeCss: '',
            customThemeFileName: '',
        },
    );
    const {
        editingThemeId,
        pendingDeleteThemeId,
        customThemeName,
        customThemeCss,
        customThemeFileName,
    } = themeEditor;

    const [picker, patchPicker] = useReducer(
        mergeReducer<{ activeColorPicker: ActivePicker; hexDraft: string }>,
        { activeColorPicker: null, hexDraft: '' },
    );
    const { activeColorPicker, hexDraft } = picker;

    const customThemeFileInputRef = useRef<HTMLInputElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);

    const pickerCoords = useSmartPosition({
        isOpen: !!activeColorPicker,
        elementRef: pickerRef,
        triggerRef,
        padding: 16,
        offset: 12,
    });

    const accentWithoutPrimary =
        profileAccentColor !== null && profilePrimaryColor === null;

    const hasChanges =
        usernameFont !== (user.usernameFont ?? 'default') ||
        glowEnabled !== (user.usernameGlow?.enabled ?? false) ||
        gradientEnabled !== (user.usernameGradient?.enabled ?? false) ||
        JSON.stringify(gradientColors.map((c): string => c.value)) !==
            JSON.stringify(user.usernameGradient?.colors || []) ||
        gradientAngle !== (user.usernameGradient?.angle ?? 90) ||
        localCustomFontUrl !== (user.settings?.customFontUrl ?? '') ||
        localCustomFontFamily !== (user.settings?.customFontFamily ?? '') ||
        use24HourTime !== (user.settings?.use24HourTime ?? false) ||
        profilePrimaryColor !== originalProfilePrimaryColor ||
        profileAccentColor !== originalProfileAccentColor;

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
            usernameFont,
            usernameGlow: {
                enabled: glowEnabled,
                color: user.usernameGlow?.color || '#ffffff',
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

        const appearanceUpdate: {
            profilePrimaryColor?: string | null;
            profileAccentColor?: string | null;
        } = {};
        if (profilePrimaryColor !== originalProfilePrimaryColor)
            appearanceUpdate.profilePrimaryColor = profilePrimaryColor;
        if (profileAccentColor !== originalProfileAccentColor)
            appearanceUpdate.profileAccentColor = profileAccentColor;
        if (Object.keys(appearanceUpdate).length > 0) {
            updateAppearance(appearanceUpdate, {
                onSuccess: (): void => {
                    patchForm({
                        originalProfilePrimaryColor: profilePrimaryColor,
                        originalProfileAccentColor: profileAccentColor,
                    });
                },
            });
        }
    };

    const handleReset = (): void => {
        patchForm({
            usernameFont: user.usernameFont ?? 'default',
            glowEnabled: user.usernameGlow?.enabled ?? false,
            gradientEnabled: user.usernameGradient?.enabled ?? false,
            gradientColors: mapGradientColors(user.usernameGradient?.colors),
            gradientAngle: user.usernameGradient?.angle ?? 90,
            localCustomFontUrl: user.settings?.customFontUrl ?? '',
            localCustomFontFamily: user.settings?.customFontFamily ?? '',
            use24HourTime: user.settings?.use24HourTime ?? false,
            profilePrimaryColor: user.profilePrimaryColor ?? null,
            originalProfilePrimaryColor: user.profilePrimaryColor ?? null,
            profileAccentColor: user.profileAccentColor ?? null,
            originalProfileAccentColor: user.profileAccentColor ?? null,
        });
    };

    const handleResetToDefaults = (): void => {
        patchForm({
            usernameFont: 'default',
            glowEnabled: false,
            gradientEnabled: false,
            gradientColors: [],
            gradientAngle: 90,
            localCustomFontUrl: '',
            localCustomFontFamily: '',
            use24HourTime: false,
        });
    };

    const handleNewCustomTheme = (): void => {
        patchTheme({
            editingThemeId: undefined,
            customThemeName: '',
            customThemeCss: '',
            customThemeFileName: '',
        });
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

        patchTheme({
            editingThemeId: savedTheme.id,
            customThemeCss: savedTheme.sourceCss,
        });
        setTheme(`custom:${savedTheme.id}`);
        showToast('Custom theme saved', 'success');
    };

    const handleEditCustomTheme = (customThemeId: string): void => {
        const customTheme = customThemes.find(
            (candidate): boolean => candidate.id === customThemeId,
        );
        if (!customTheme) return;

        patchTheme({
            editingThemeId: customTheme.id,
            customThemeName: customTheme.name,
            customThemeCss: customTheme.sourceCss,
            customThemeFileName: `${customTheme.name}.css`,
        });
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

        patchTheme({ pendingDeleteThemeId: undefined });
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
        reader.addEventListener('load', (): void => {
            const css = typeof reader.result === 'string' ? reader.result : '';
            patchTheme({
                editingThemeId: undefined,
                customThemeName: file.name.replace(/\.css$/i, ''),
                customThemeCss: css,
                customThemeFileName: file.name,
            });
        });
        reader.onerror = (): void => {
            showToast('Could not read that CSS file', 'error');
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const addGradientColor = (): void => {
        if (gradientColors.length < 20) {
            patchForm({
                gradientColors: [
                    ...gradientColors,
                    { id: Math.random().toString(36), value: '#ff0000' },
                ],
            });
        }
    };

    const removeGradientColor = (index: number): void => {
        const newColors = [...gradientColors];
        newColors.splice(index, 1);
        patchForm({ gradientColors: newColors });
    };

    const updateGradientColor = (index: number, color: string): void => {
        const newColors = gradientColors.map(
            (c): { id: string; value: string } => ({ ...c }),
        );
        const target = newColors[index];
        if (!target) return;
        target.value = color;
        patchForm({ gradientColors: newColors });
    };

    const previewUser = {
        ...user,
        profilePrimaryColor: profilePrimaryColor ?? undefined,
        profileAccentColor: profileAccentColor ?? undefined,
        usernameFont: usernameFont === 'default' ? undefined : usernameFont,
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

    const pendingDeleteTheme = customThemes.find(
        (customTheme): boolean => customTheme.id === pendingDeleteThemeId,
    );

    return {
        // style / font state
        usernameFont,
        glowEnabled,
        gradientEnabled,
        gradientColors,
        gradientAngle,
        localCustomFontUrl,
        localCustomFontFamily,
        use24HourTime,
        setUsernameFont: (v: UsernameFont): void => {
            patchForm({ usernameFont: v });
        },
        setGlowEnabled: (v: boolean): void => {
            patchForm({ glowEnabled: v });
        },
        setGradientEnabled: (v: boolean): void => {
            patchForm({ gradientEnabled: v });
        },
        setGradientAngle: (v: number): void => {
            patchForm({ gradientAngle: v });
        },
        setLocalCustomFontUrl: (v: string): void => {
            patchForm({ localCustomFontUrl: v });
        },
        setLocalCustomFontFamily: (v: string): void => {
            patchForm({ localCustomFontFamily: v });
        },
        setUse24HourTime: (v: boolean): void => {
            patchForm({ use24HourTime: v });
        },
        addGradientColor,
        removeGradientColor,
        updateGradientColor,
        // profile colors
        profilePrimaryColor,
        profileAccentColor,
        accentWithoutPrimary,
        setProfilePrimaryColor: (v: string | null): void => {
            patchForm({ profilePrimaryColor: v });
        },
        setProfileAccentColor: (v: string | null): void => {
            patchForm({ profileAccentColor: v });
        },
        // color picker
        activeColorPicker,
        hexDraft,
        setActiveColorPicker: (v: ActivePicker): void => {
            patchPicker({ activeColorPicker: v });
        },
        setHexDraft: (v: string): void => {
            patchPicker({ hexDraft: v });
        },
        pickerRef,
        triggerRef,
        pickerCoords,
        // custom themes
        customThemes,
        theme,
        setTheme: (t: string): void => {
            setTheme(t as Parameters<typeof setTheme>[0]);
        },
        editingThemeId,
        pendingDeleteThemeId,
        pendingDeleteTheme,
        customThemeName,
        customThemeCss,
        customThemeFileName,
        customThemeFileInputRef,
        setCustomThemeName: (v: string): void => {
            patchTheme({ customThemeName: v });
        },
        setCustomThemeCss: (v: string): void => {
            patchTheme({ customThemeCss: v });
        },
        setPendingDeleteThemeId: (v: string | undefined): void => {
            patchTheme({ pendingDeleteThemeId: v });
        },
        handleNewCustomTheme,
        handleSaveCustomTheme,
        handleEditCustomTheme,
        handleConfirmDeleteCustomTheme,
        handleCustomThemeFileChange,
        // derived + save
        previewUser,
        hasChanges,
        isPending,
        handleSave,
        handleReset,
        handleResetToDefaults,
    };
};
