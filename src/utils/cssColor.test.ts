import { describe, expect, it, vi } from 'vitest';

import { cssTokenToHex } from './cssColor';

// jsdom does not resolve `var()` tokens; only a real browser's cascade can.
// So the injected resolver reads from a lookup that stands in for the probe
// element, keyed by the token the parser was handed.
const resolveFrom = (computed: string): ((token: string) => string) =>
    vi.fn((token: string): string => (token === '' ? '' : computed));

describe('cssTokenToHex', (): void => {
    it('normalizes an rgb token to hex', (): void => {
        expect(cssTokenToHex('#362500', resolveFrom('rgb(54, 37, 0)'))).toBe(
            '#362500',
        );
    });

    it('lowercases the hex digits', (): void => {
        expect(cssTokenToHex('#FFAA00', resolveFrom('rgb(255, 170, 0)'))).toBe(
            '#ffaa00',
        );
    });

    it('keeps single-digit channels zero-padded', (): void => {
        expect(cssTokenToHex('#050200', resolveFrom('rgb(5, 2, 0)'))).toBe(
            '#050200',
        );
    });

    it('ignores an alpha channel when one is present', (): void => {
        expect(
            cssTokenToHex('#123456', resolveFrom('rgba(18, 52, 86, 0.5)')),
        ).toBe('#123456');
    });

    it('accepts space-separated channels', (): void => {
        expect(cssTokenToHex('#123456', resolveFrom('rgb(18 52 86)'))).toBe(
            '#123456',
        );
    });

    it('trims surrounding whitespace from the token', (): void => {
        expect(
            cssTokenToHex('  #123456\n', resolveFrom('rgb(18, 52, 86)')),
        ).toBe('#123456');
    });

    it('returns the empty token without probing', (): void => {
        const resolve = resolveFrom('rgb(0, 0, 0)');

        expect(cssTokenToHex('', resolve)).toBe('#000000');
        expect(cssTokenToHex('   ', resolve)).toBe('#000000');
        expect(resolve).not.toHaveBeenCalled();
    });

    it('falls back to a neutral token when the parser rejects the color', (): void => {
        const token = 'color-mix(in srgb, red 50%, blue)';

        expect(cssTokenToHex(token, resolveFrom(token))).toBe('#000000');
    });

    it('falls back to a neutral token when the resolution is not a color', (): void => {
        expect(cssTokenToHex('var(--probe)', resolveFrom('var(--probe)'))).toBe(
            '#000000',
        );
    });
});
