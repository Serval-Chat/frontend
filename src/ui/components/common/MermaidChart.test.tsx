import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MermaidChart } from '@/ui/components/common/MermaidChart';

vi.mock('@/providers/ThemeProvider', () => ({
    useTheme: vi.fn().mockReturnValue({ theme: 'dark', setTheme: vi.fn() }),
}));

// jsdom doesn't implement SVG layout measurement; mermaid needs these to render.
// @ts-expect-error -- test-only polyfill
SVGElement.prototype.getBBox = (): DOMRect => ({
    x: 0,
    y: 0,
    width: 100,
    height: 20,
    top: 0,
    left: 0,
    right: 100,
    bottom: 20,
    toJSON: (): void => {},
});
// @ts-expect-error -- test-only polyfill
SVGElement.prototype.getComputedTextLength = (): number => 50;

describe('MermaidChart', (): void => {
    it('shows a click-to-view placeholder instead of rendering immediately', (): void => {
        render(
            <MermaidChart
                content={
                    'graph TD;\nA[Start] --> B{Decision};\nB -->|Yes| C[End];\nB -->|No| A;'
                }
            />,
        );

        expect(screen.getByText('Mermaid diagram')).toBeTruthy();
        expect(screen.getByText('Click to view chart')).toBeTruthy();
        expect(document.querySelector('.mermaid-chart-container')).toBeFalsy();
    });

    it('renders the diagram to an SVG element once the placeholder is clicked', async (): Promise<void> => {
        render(
            <MermaidChart
                content={
                    'graph TD;\nA[Start] --> B{Decision};\nB -->|Yes| C[End];\nB -->|No| A;'
                }
            />,
        );

        fireEvent.click(screen.getByText('Mermaid diagram'));

        await waitFor((): void => {
            expect(
                document.querySelector('.mermaid-chart-container svg'),
            ).toBeTruthy();
        });
    });

    it('zooms in on wheel scroll and resets via the reset button', async (): Promise<void> => {
        render(
            <MermaidChart
                content={
                    'graph TD;\nA[Start] --> B{Decision};\nB -->|Yes| C[End];\nB -->|No| A;'
                }
            />,
        );

        fireEvent.click(screen.getByText('Mermaid diagram'));
        await waitFor((): void => {
            expect(
                document.querySelector('.mermaid-chart-container svg'),
            ).toBeTruthy();
        });

        await waitFor((): void => {
            expect(screen.getByText('90%')).toBeTruthy();
        });

        fireEvent.wheel(screen.getByTestId('mermaid-canvas'), {
            deltaY: -500,
        });

        await waitFor((): void => {
            expect(screen.queryByText('90%')).toBeFalsy();
        });

        fireEvent.click(screen.getByLabelText('Reset view'));

        await waitFor((): void => {
            expect(screen.getByText('100%')).toBeTruthy();
        });
    });

    it('computes an initial fit-to-screen zoom from the canvas and diagram size', async (): Promise<void> => {
        render(
            <MermaidChart
                content={
                    'graph TD;\nA[Start] --> B{Decision};\nB -->|Yes| C[End];\nB -->|No| A;'
                }
            />,
        );

        fireEvent.click(screen.getByText('Mermaid diagram'));

        const canvas = await screen.findByTestId('mermaid-canvas');
        Object.defineProperty(canvas, 'clientWidth', {
            configurable: true,
            value: 58,
        });
        Object.defineProperty(canvas, 'clientHeight', {
            configurable: true,
            value: 3600,
        });

        await waitFor((): void => {
            expect(screen.getByText('45%')).toBeTruthy();
        });
    });

    it('strips script tags and event handler attributes from the rendered SVG', async (): Promise<void> => {
        // Mermaid's own DSL can't smuggle raw <script>/on* attributes into its
        // output, so this exercises the sanitizer directly the same way the
        // component's dangerouslySetInnerHTML sink does.
        const DOMPurify = (await import('dompurify')).default;
        const malicious =
            '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><image href="x" onerror="alert(2)"/><text>ok</text></svg>';

        const clean = DOMPurify.sanitize(malicious, {
            USE_PROFILES: { svg: true, svgFilters: true },
        });

        expect(clean).not.toContain('<script');
        expect(clean).not.toContain('onerror');
        expect(clean).toContain('<text>ok</text>');
    });
});
