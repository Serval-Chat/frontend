import React, { useEffect, useRef, useState } from 'react';

import mermaid from 'mermaid';

import { useTheme } from '@/providers/ThemeProvider';

interface MermaidChartProps {
    content: string;
}

const DEFAULT_FONT = "'Noto Sans', system-ui, -apple-system, sans-serif";

const resolveThemeVariables = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};

    const style = getComputedStyle(document.documentElement);

    const getVar = (name: string, fallback: string): string => {
        let value = style.getPropertyValue(name).trim();
        if (value.startsWith('var(')) {
            const match = value.match(/var\((--[^)]+)\)/);
            if (match) {
                value = style.getPropertyValue(match[1]).trim();
            }
        }
        return value || fallback;
    };

    const isDark =
        document.documentElement.classList.contains('theme-dark') ||
        document.documentElement.classList.contains('theme-deep-ocean') ||
        document.documentElement.classList.contains('theme-violet') ||
        document.documentElement.classList.contains('theme-forest-green');

    const bgPrimary = getVar('--background', isDark ? '#18181b' : '#ffffff');
    const bgSecondary = getVar(
        '--bg-secondary',
        isDark ? '#27272a' : '#f4f4f5',
    );
    const fg = getVar('--foreground', isDark ? '#ffffff' : '#000000');
    const mutedFg = getVar('--muted-foreground', '#888888');
    const primary = getVar('--primary', '#3b82f6');
    const primaryMuted = getVar(
        '--primary-muted',
        isDark ? '#1e3a8a' : '#dbeafe',
    );

    return {
        primaryColor: primaryMuted,
        primaryTextColor: fg,
        primaryBorderColor: primary,
        lineColor: mutedFg,
        secondaryColor: getVar('--success-muted', '#dcfce7'),
        tertiaryColor: getVar('--caution-muted', '#fef3c7'),

        mainBkg: bgSecondary,
        nodeBkg: bgSecondary,
        nodeBorder: getVar('--border-subtle', 'rgba(0,0,0,0.1)'),
        clusterBkg: getVar('--bg-subtle', bgSecondary),
        clusterBorder: getVar('--divider', 'rgba(0,0,0,0.1)'),

        nodeTextColor: fg,
        defaultLinkColor: mutedFg,
        titleColor: fg,
        edgeLabelBackground: bgPrimary,

        fontFamily: getVar('--font-sans', DEFAULT_FONT),
        fontSize: '14px',

        tertiaryTextColor: fg,
        secondaryTextColor: fg,
    };
};

/**
 * @description Renders a mermaid chart
 */
export const MermaidChart: React.FC<MermaidChartProps> = ({ content }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svgContent, setSvgContent] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const { theme } = useTheme();

    useEffect(() => {
        const renderChart = async (): Promise<void> => {
            try {
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'base',
                    themeVariables: resolveThemeVariables(),
                    securityLevel: 'loose',
                });

                const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
                const { svg } = await mermaid.render(id, content);
                setSvgContent(svg);
                setError(null);
            } catch (err: unknown) {
                console.error('Mermaid render error:', err);
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to render chart',
                );
            }
        };

        void renderChart();
    }, [content, theme]);

    if (error) {
        return (
            <div className="my-2 overflow-x-auto rounded-lg border border-l-4 border-danger/50 border-l-danger bg-bg-secondary p-4 font-mono text-sm text-danger shadow-sm">
                <div className="mb-2 font-bold">Mermaid Syntax Error:</div>
                <pre className="whitespace-pre-wrap">{error}</pre>
            </div>
        );
    }

    if (!svgContent) {
        return (
            <div className="my-2 flex min-h-[100px] animate-pulse items-center justify-center rounded-lg border border-border-subtle bg-bg-secondary p-4">
                <span className="text-sm font-medium text-muted-foreground">
                    Rendering chart...
                </span>
            </div>
        );
    }

    return (
        <div
            className="mermaid-chart-container my-2 flex items-center justify-center overflow-x-auto overflow-y-hidden rounded-lg border border-border-subtle bg-bg-secondary p-6 shadow-sm transition-all hover:border-primary/40 [&>svg]:h-auto [&>svg]:max-w-full"
            dangerouslySetInnerHTML={{ __html: svgContent }}
            ref={containerRef}
        />
    );
};
