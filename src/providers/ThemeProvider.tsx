import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import { useMe } from '@/api/users/users.queries';

export type Theme =
    | 'serval'
    | 'dark'
    | 'deep-ocean'
    | 'light'
    | 'cherry'
    | 'high-contrast'
    | 'violet'
    | 'forest-green';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    customFontUrl: string;
    setCustomFontUrl: (url: string) => void;
    customFontFamily: string;
    setCustomFontFamily: (family: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { data: user } = useMe();

    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('theme');
        return (saved as Theme) || 'serval';
    });

    const [localFontUrl, setLocalFontUrl] = useState(
        () => localStorage.getItem('custom-font-url') || '',
    );
    const [localFontFamily, setLocalFontFamily] = useState(
        () => localStorage.getItem('custom-font-family') || '',
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

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove(
            'theme-serval',
            'theme-dark',
            'theme-deep-ocean',
            'theme-light',
            'theme-cherry',
            'theme-high-contrast',
            'theme-violet',
            'theme-forest-green',
        );
        root.classList.add(`theme-${theme}`);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const linkId = 'custom-google-font';
        let link = document.getElementById(linkId) as HTMLLinkElement | null;

        if (customFontUrl) {
            if (!link) {
                link = document.createElement('link');
                link.id = linkId;
                link.rel = 'stylesheet';
                link.media = 'print';
                link.onload = () => {
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
            customFontUrl,
            setCustomFontUrl,
            customFontFamily,
            setCustomFontFamily,
        }),
        [theme, customFontUrl, customFontFamily],
    );

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
