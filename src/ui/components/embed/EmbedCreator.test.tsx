import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { MessagePayload } from '@/types/embed';

import { EmbedCreator } from './EmbedCreator';

const withColorPrimary = (value: string, run: () => void): void => {
    document.documentElement.style.setProperty('--color-primary', value);
    try {
        run();
    } finally {
        // Unmount before removing the token, or the swatch's observer
        // re-resolves to the empty token outside act().
        cleanup();
        document.documentElement.style.removeProperty('--color-primary');
    }
};

describe('EmbedCreator', (): void => {
    it('adds new embeds without an author color', (): void => {
        const onChange = vi.fn();
        render(<EmbedCreator value={{ embeds: [] }} onChange={onChange} />);

        fireEvent.click(screen.getByRole('button', { name: /Add embed/ }));

        expect(onChange).toHaveBeenCalledTimes(1);
        const payload = onChange.mock.calls[0]?.[0] as MessagePayload;
        expect(payload.embeds).toHaveLength(1);
        expect(payload.embeds?.[0]).not.toHaveProperty('color');
    });

    it("shows the embed's own color in the swatch when one is set", (): void => {
        render(
            <EmbedCreator
                value={{ embeds: [{ type: 'rich', color: 0xff0000 }] }}
                onChange={vi.fn()}
            />,
        );

        expect(screen.getByLabelText('Embed color')).toHaveValue('#ff0000');
    });

    it('shows the theme primary in the swatch for a colorless embed', (): void => {
        withColorPrimary('#362500', (): void => {
            render(
                <EmbedCreator
                    value={{ embeds: [{ type: 'rich' }] }}
                    onChange={vi.fn()}
                />,
            );

            expect(screen.getByLabelText('Embed color')).toHaveValue('#362500');
        });
    });

    it('reads --color-primary, the token the embed bar renders with', (): void => {
        document.documentElement.style.setProperty('--primary', '#aaaaaa');
        document.documentElement.style.setProperty(
            '--color-primary',
            '#123456',
        );
        try {
            render(
                <EmbedCreator
                    value={{ embeds: [{ type: 'rich' }] }}
                    onChange={vi.fn()}
                />,
            );

            expect(screen.getByLabelText('Embed color')).toHaveValue('#123456');
        } finally {
            cleanup();
            document.documentElement.style.removeProperty('--primary');
            document.documentElement.style.removeProperty('--color-primary');
        }
    });

    it('converts an hsl theme primary to hex for the swatch', (): void => {
        withColorPrimary('hsl(330 100% 50%)', (): void => {
            render(
                <EmbedCreator
                    value={{ embeds: [{ type: 'rich' }] }}
                    onChange={vi.fn()}
                />,
            );

            expect(screen.getByLabelText('Embed color')).toHaveValue('#ff0080');
        });
    });

    it('converts a negative hsl hue correctly', (): void => {
        withColorPrimary('hsl(-90 100% 50%)', (): void => {
            render(
                <EmbedCreator
                    value={{ embeds: [{ type: 'rich' }] }}
                    onChange={vi.fn()}
                />,
            );

            expect(screen.getByLabelText('Embed color')).toHaveValue('#8000ff');
        });
    });

    it('falls back to a neutral swatch when the theme primary is unparseable', (): void => {
        withColorPrimary('color-mix(in srgb, red 50%, blue)', (): void => {
            render(
                <EmbedCreator
                    value={{ embeds: [{ type: 'rich' }] }}
                    onChange={vi.fn()}
                />,
            );

            expect(screen.getByLabelText('Embed color')).toHaveValue('#000000');
        });
    });

    it('copies the composed JSON through the in-field glyph', async (): Promise<void> => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText },
        });
        render(<EmbedCreator value={{ embeds: [] }} onChange={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: /JSON output/ }));
        fireEvent.click(screen.getByRole('button', { name: 'Copy JSON' }));
        await act(async (): Promise<void> => undefined);

        expect(writeText).toHaveBeenCalledWith(
            JSON.stringify({ embeds: [] }, null, 2),
        );
    });

    it('re-resolves the swatch when the theme token changes', async (): Promise<void> => {
        document.documentElement.style.setProperty(
            '--color-primary',
            '#111111',
        );
        try {
            render(
                <EmbedCreator
                    value={{ embeds: [{ type: 'rich' }] }}
                    onChange={vi.fn()}
                />,
            );
            expect(screen.getByLabelText('Embed color')).toHaveValue('#111111');

            await act(async (): Promise<void> => {
                document.documentElement.style.setProperty(
                    '--color-primary',
                    '#222222',
                );
            });

            expect(screen.getByLabelText('Embed color')).toHaveValue('#222222');
        } finally {
            cleanup();
            document.documentElement.style.removeProperty('--color-primary');
        }
    });
});
