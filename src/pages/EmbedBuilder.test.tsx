import { cleanup, fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EmbedBuilder } from './EmbedBuilder';

vi.mock('@/api/users/users.queries', () => ({
    useMe: vi.fn().mockReturnValue({ data: undefined }),
}));

describe('EmbedBuilder', (): void => {
    it('defaults the preview to the theme accent, not a hardcoded color', (): void => {
        document.documentElement.style.setProperty(
            '--color-primary',
            '#362500',
        );
        try {
            const { container } = render(<EmbedBuilder />);

            const bar = container.querySelector('div[style*="border-left"]');
            expect(bar).not.toBeNull();
            expect(bar?.getAttribute('style')).toContain(
                'var(--color-primary)',
            );
            const swatch = container.querySelector(
                'input[type="color"]',
            ) as HTMLInputElement | null;
            expect(swatch).not.toBeNull();
            expect(swatch?.value).toBe('#362500');
        } finally {
            cleanup();
            document.documentElement.style.removeProperty('--color-primary');
        }
    });

    it('keeps the swatch and the preview bar on the same theme color', (): void => {
        document.documentElement.style.setProperty(
            '--color-primary',
            '#362500',
        );
        try {
            const { container } = render(<EmbedBuilder />);

            const bar = container.querySelector('div[style*="border-left"]');
            const swatch = container.querySelector(
                'input[type="color"]',
            ) as HTMLInputElement | null;
            expect(bar?.getAttribute('style')).toContain(
                'var(--color-primary)',
            );
            expect(swatch?.value).toBe('#362500');
        } finally {
            cleanup();
            document.documentElement.style.removeProperty('--color-primary');
        }
    });

    it('keeps the preview bar and the swatch agreeing once the user picks a color', (): void => {
        document.documentElement.style.setProperty(
            '--color-primary',
            '#362500',
        );
        try {
            const { container } = render(<EmbedBuilder />);
            const swatch = container.querySelector(
                'input[type="color"]',
            ) as HTMLInputElement;

            fireEvent.change(swatch, { target: { value: '#ff0000' } });

            const bar = container.querySelector('div[style*="border-left"]');
            expect(bar?.getAttribute('style')).toContain(
                '4px solid rgb(255, 0, 0)',
            );
            expect(container.querySelector('input[type="color"]')).toHaveValue(
                '#ff0000',
            );
        } finally {
            cleanup();
            document.documentElement.style.removeProperty('--color-primary');
        }
    });
});
