import React, { useEffect, useRef, useState } from 'react';

import mermaid from 'mermaid';

interface MermaidChartProps {
    content: string;
}

/**
 * @description Renders a mermaid chart
 */
export const MermaidChart: React.FC<MermaidChartProps> = ({ content }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svgContent, setSvgContent] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const renderChart = async () => {
            try {
                const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'dark',
                    securityLevel: 'strict',
                    fontFamily: 'Inter, sans-serif',
                });

                const { svg } = await mermaid.render(id, content);

                setSvgContent(svg);
                setError(null);
            } catch (err: unknown) {
                console.error('Mermaid render error:', err);
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Failed to render chart');
                }
            }
        };

        void renderChart();
    }, [content]);

    if (error) {
        return (
            <div className="my-2 p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-danger/50)] border-l-4 border-l-[var(--color-danger)] font-mono text-sm overflow-x-auto text-[var(--color-danger)] shadow-sm">
                <div className="font-bold mb-2">Mermaid Syntax Error:</div>
                <pre className="whitespace-pre-wrap">{error}</pre>
            </div>
        );
    }

    if (!svgContent) {
        return (
            <div className="my-2 p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] flex items-center justify-center min-h-[100px] animate-pulse">
                <span className="text-[var(--color-muted-foreground)] text-sm font-medium">
                    Rendering chart...
                </span>
            </div>
        );
    }

    return (
        <div
            className="my-2 p-4 rounded-lg bg-[var(--color-background)] border border-[var(--color-border-subtle)] overflow-x-auto overflow-y-hidden shadow-sm flex items-center justify-center [&>svg]:max-w-full [&>svg]:h-auto transition-colors hover:border-[var(--color-primary/40)]"
            dangerouslySetInnerHTML={{ __html: svgContent }}
            ref={containerRef}
        />
    );
};
