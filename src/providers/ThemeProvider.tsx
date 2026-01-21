import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'serval' | 'dark' | 'light' | 'high-contrast';

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

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
