import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme =
    | 'serval'
    | 'dark'
    | 'light'
    | 'high-contrast'
    | 'violet'
    | 'forest-green';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('theme');
        return (saved as Theme) || 'serval';
    });

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove(
            'theme-serval',
            'theme-dark',
            'theme-light',
            'theme-high-contrast',
            'theme-violet',
            'theme-forest-green',
        );
        root.classList.add(`theme-${theme}`);
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
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
