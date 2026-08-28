import { describe, expect, it } from 'vitest';

import { parseAnsi } from '@/console/utils/ansiParser';

interface RenderedSegment {
    text: string;
    color?: string;
    backgroundColor?: string;
}

const render = (text: string): RenderedSegment[] => {
    const nodes = parseAnsi(text);
    return nodes.map((node): RenderedSegment => {
        if (typeof node === 'string') return { text: node };
        const element = node as React.ReactElement<{
            children: string;
            style: { color?: string; backgroundColor?: string };
        }>;
        return {
            text: element.props.children,
            color: element.props.style.color,
            backgroundColor: element.props.style.backgroundColor,
        };
    });
};

describe('parseAnsi truecolor support', (): void => {
    it('renders a single 24-bit foreground color segment', (): void => {
        const result = render('\x1b[38;2;12;34;56mX\x1b[0m');
        expect(result).toEqual([{ text: 'X', color: 'rgb(12,34,56)' }]);
    });

    it('renders back-to-back truecolor segments with distinct colors', (): void => {
        const text =
            '\x1b[38;2;255;0;0mA\x1b[0m' +
            '\x1b[38;2;0;255;0mB\x1b[0m' +
            '\x1b[38;2;0;0;255mC\x1b[0m';
        expect(render(text)).toEqual([
            { text: 'A', color: 'rgb(255,0,0)' },
            { text: 'B', color: 'rgb(0,255,0)' },
            { text: 'C', color: 'rgb(0,0,255)' },
        ]);
    });

    it('renders truecolor background alongside a bold (bright) foreground color', (): void => {
        const result = render('\x1b[1;32;48;2;10;20;30mY\x1b[0m');
        expect(result).toEqual([
            {
                text: 'Y',
                color: '#55ff55',
                backgroundColor: 'rgb(10,20,30)',
            },
        ]);
    });

    it('renders bright colors distinctly from their standard counterparts', (): void => {
        for (let code = 1; code <= 6; code++) {
            const standard = render(`\x1b[${29 + code}mX\x1b[0m`)[0];
            const bright = render(`\x1b[${89 + code}mX\x1b[0m`)[0];
            expect(bright?.color).not.toBe(standard?.color);
        }
    });

    it('treats bold + a standard color as the bright variant (classic terminal convention)', (): void => {
        const plain = render('\x1b[33mX\x1b[0m')[0];
        const bold = render('\x1b[1;33mX\x1b[0m')[0];

        expect(plain?.color).toBe('#aa5500');
        expect(bold?.color).toBe('#ffff55');
    });

    it('resolves standard (not bright) colors for codes issued after SGR 22 clears bold', (): void => {
        const result = render('\x1b[1;33mA\x1b[22;33mB\x1b[0m');
        expect(result).toEqual([
            { text: 'A', color: '#ffff55' },
            { text: 'B', color: '#aa5500' },
        ]);
    });
});
