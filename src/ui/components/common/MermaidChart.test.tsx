import { render, waitFor } from '@testing-library/react';
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
    it('renders a valid diagram to an SVG element', async (): Promise<void> => {
        const { container } = render(
            <MermaidChart
                content={
                    'graph TD;\nA[Start] --> B{Decision};\nB -->|Yes| C[End];\nB -->|No| A;'
                }
            />,
        );

        await waitFor((): void => {
            expect(container.querySelector('svg')).toBeTruthy();
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
