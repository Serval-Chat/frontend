import React, {
    createContext,
    use,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import { useMe } from '@/api/users/users.queries';
import {
    type CustomThemeDraft,
    type CustomThemeFile,
    createCustomThemeFile,
    readCustomThemes,
    updateCustomThemeFile,
    writeCustomThemes,
} from '@/styles/customThemes';

export type BuiltInTheme =
    | 'serval'
    | 'dark'
    | 'deep-ocean'
    | 'light'
    | 'cherry'
    | 'high-contrast'
    | 'violet'
    | 'forest-green'
    | 'pride';

export type CustomThemeId = `custom:${string}`;
export type Theme = BuiltInTheme | CustomThemeId;

const BUILT_IN_THEMES: BuiltInTheme[] = [
    'serval',
    'dark',
    'deep-ocean',
    'light',
    'cherry',
    'high-contrast',
    'violet',
    'forest-green',
    'pride',
];

const CUSTOM_THEME_STYLE_ID = 'serchat-custom-theme';

const isBuiltInTheme = (theme: string): theme is BuiltInTheme =>
    BUILT_IN_THEMES.includes(theme as BuiltInTheme);

const getCustomThemeId = (theme: Theme): string | null =>
    theme.startsWith('custom:') ? theme.slice('custom:'.length) : null;

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    builtInThemes: BuiltInTheme[];
    customThemes: CustomThemeFile[];
    saveCustomTheme: (theme: CustomThemeDraft) => CustomThemeFile;
    deleteCustomTheme: (id: string) => void;
    customFontUrl: string;
    setCustomFontUrl: (url: string) => void;
    customFontFamily: string;
    setCustomFontFamily: (family: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: user } = useMe();

    const [customThemes, setCustomThemes] =
        useState<CustomThemeFile[]>(readCustomThemes);
    const [theme, setThemeState] = useState<Theme>((): Theme => {
        const saved =
            (localStorage.getItem('theme') as Theme | null) || 'serval';
        const customThemeId = getCustomThemeId(saved);

        if (
            customThemeId &&
            !customThemes.some(
                (customTheme): boolean => customTheme.id === customThemeId,
            )
        ) {
            return 'serval';
        }

        return saved;
    });

    const [localFontUrl, setLocalFontUrl] = useState(
        (): string => localStorage.getItem('custom-font-url') || '',
    );
    const [localFontFamily, setLocalFontFamily] = useState(
        (): string => localStorage.getItem('custom-font-family') || '',
    );

    const remoteUrl = user?.settings?.customFontUrl;
    const remoteFamily = user?.settings?.customFontFamily;

    const customFontUrl =
        remoteUrl !== undefined ? (remoteUrl ?? '') : localFontUrl;
    const customFontFamily =
        remoteFamily !== undefined ? (remoteFamily ?? '') : localFontFamily;

    const setCustomFontUrl = (url: string): void => setLocalFontUrl(url);
    const setCustomFontFamily = (family: string): void =>
        setLocalFontFamily(family);

    const setTheme = useCallback(
        (nextTheme: Theme): void => {
            const customThemeId = getCustomThemeId(nextTheme);

            if (
                customThemeId &&
                !customThemes.some(
                    (customTheme): boolean => customTheme.id === customThemeId,
                )
            ) {
                setThemeState('serval');
                return;
            }

            setThemeState(nextTheme);
        },
        [customThemes],
    );

    useEffect((): void => {
        const root = document.documentElement;
        const builtInTheme = isBuiltInTheme(theme) ? theme : 'serval';

        root.classList.remove(
            ...BUILT_IN_THEMES.map(
                (builtInThemeName): string => `theme-${builtInThemeName}`,
            ),
        );
        root.classList.add(`theme-${builtInTheme}`);
        localStorage.setItem('theme', theme);

        const customThemeId = getCustomThemeId(theme);
        const selectedCustomTheme = customThemes.find(
            (customTheme): boolean => customTheme.id === customThemeId,
        );
        customThemes.forEach((customTheme): void => {
            root.removeAttribute(customTheme.scopeAttribute);
        });
        root.removeAttribute('data-custom-theme');

        let style = document.getElementById(
            CUSTOM_THEME_STYLE_ID,
        ) as HTMLStyleElement | null;

        if (selectedCustomTheme) {
            if (!style) {
                style = document.createElement('style');
                style.id = CUSTOM_THEME_STYLE_ID;
                document.head.appendChild(style);
            }
            style.textContent = selectedCustomTheme.css;
            root.setAttribute(selectedCustomTheme.scopeAttribute, '');
        } else {
            style?.remove();
        }
    }, [theme, customThemes]);

    const saveCustomTheme = useCallback(
        (draft: CustomThemeDraft): CustomThemeFile => {
            const existing = draft.id
                ? customThemes.find(
                      (customTheme): boolean => customTheme.id === draft.id,
                  )
                : undefined;
            const nextTheme = existing
                ? updateCustomThemeFile(existing, draft)
                : createCustomThemeFile(draft);
            const nextThemes = existing
                ? customThemes.map(
                      (customTheme): CustomThemeFile =>
                          customTheme.id === nextTheme.id
                              ? nextTheme
                              : customTheme,
                  )
                : [...customThemes, nextTheme];

            setCustomThemes(nextThemes);
            writeCustomThemes(nextThemes);
            return nextTheme;
        },
        [customThemes],
    );

    const deleteCustomTheme = useCallback(
        (id: string): void => {
            const nextThemes = customThemes.filter(
                (customTheme): boolean => customTheme.id !== id,
            );

            setCustomThemes(nextThemes);
            writeCustomThemes(nextThemes);

            if (theme === `custom:${id}`) {
                setTheme('serval');
            }
        },
        [customThemes, setTheme, theme],
    );

    useEffect((): void => {
        const linkId = 'custom-google-font';
        let link = document.getElementById(linkId) as HTMLLinkElement | null;

        if (customFontUrl) {
            if (!link) {
                link = document.createElement('link');
                link.id = linkId;
                link.rel = 'stylesheet';
                link.media = 'print';
                link.onload = (): void => {
                    if (link) link.media = 'all';
                };
                document.head.appendChild(link);
            }
            if (link.getAttribute('href') !== customFontUrl) {
                link.href = customFontUrl;
            }
            localStorage.setItem('custom-font-url', customFontUrl);
        } else {
            link?.remove();
            localStorage.removeItem('custom-font-url');
        }

        if (customFontFamily) {
            document.documentElement.style.setProperty(
                '--font-sans',
                `"${customFontFamily}", system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
            );
            localStorage.setItem('custom-font-family', customFontFamily);
        } else {
            document.documentElement.style.removeProperty('--font-sans');
            localStorage.removeItem('custom-font-family');
        }
    }, [customFontUrl, customFontFamily]);

    const value = useMemo(
        () => ({
            theme,
            setTheme,
            builtInThemes: BUILT_IN_THEMES,
            customThemes,
            saveCustomTheme,
            deleteCustomTheme,
            customFontUrl,
            setCustomFontUrl,
            customFontFamily,
            setCustomFontFamily,
        }),
        [
            theme,
            customThemes,
            saveCustomTheme,
            setTheme,
            deleteCustomTheme,
            customFontUrl,
            customFontFamily,
        ],
    );

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = (): ThemeContextType => {
    const context = use(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
