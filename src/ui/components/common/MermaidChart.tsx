import React, { useEffect, useRef, useState } from 'react';

import mermaid from 'mermaid';

interface MermaidChartProps {
    content: string;
}

mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'Inter, sans-serif',
});

/**
 * @description Renders a mermaid chart
 */
export const MermaidChart: React.FC<MermaidChartProps> = ({ content }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svgContent, setSvgContent] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const renderChart = async (): Promise<void> => {
            try {
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
    }, [content]);

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
            className="my-2 flex items-center justify-center overflow-x-auto overflow-y-hidden rounded-lg border border-border-subtle bg-background p-4 shadow-sm transition-colors hover:border-primary/40 [&>svg]:h-auto [&>svg]:max-w-full"
            dangerouslySetInnerHTML={{ __html: svgContent }}
            ref={containerRef}
        />
    );
};
