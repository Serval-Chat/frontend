import { describe, expect, it } from 'vitest';

import { Terminal } from '@/console/Terminal';
import { parseAnsi } from '@/console/utils/ansiParser';

import { ansitestCommand } from './ansitest';

describe('ansitest command', (): void => {
    it('matches only the ansitest command', (): void => {
        expect(ansitestCommand.match(1, ['ansitest'])).toBe(true);
        expect(ansitestCommand.match(1, ['ANSITEST'])).toBe(true);
        expect(ansitestCommand.match(1, ['ansi'])).toBe(false);
        expect(ansitestCommand.match(1, ['snake'])).toBe(false);
    });

    it('produces output lines with no embedded newlines', (): void => {
        const result = ansitestCommand.execute(1, ['ansitest'], {
            dispatch: (() => {}) as any,
        });

        expect(result.output).toBeDefined();
        for (const line of result.output ?? []) {
            expect(line).not.toContain('\n');
        }
    });

    it('round-trips every line through the terminal and ANSI parser without corruption', (): void => {
        const result = ansitestCommand.execute(1, ['ansitest'], {
            dispatch: (() => {}) as any,
        });
        const lines = result.output ?? [];

        const terminal = new Terminal({ size: { columns: 200, rows: 200 } });
        terminal.writeLines(lines);

        const stored = terminal.snapshot().map((l) => l.text);
        expect(stored.filter(Boolean)).toEqual(lines.filter(Boolean));

        for (const line of stored) {
            expect(parseAnsi(line)).toBeDefined();
        }
    });

    it('renders the truecolor gradient as 48 distinct colored segments', (): void => {
        const result = ansitestCommand.execute(1, ['ansitest'], {
            dispatch: (() => {}) as any,
        });
        const lines = result.output ?? [];
        const gradientLine = lines.find((line) => line.includes('[38;2;'));

        expect(gradientLine).toBeDefined();
        const nodes = parseAnsi(gradientLine ?? '');
        expect(nodes.length).toBe(48);
    });

    it('applies the correct SGR code for each standard foreground swatch', (): void => {
        const result = ansitestCommand.execute(1, ['ansitest'], {
            dispatch: (() => {}) as any,
        });
        const lines = result.output ?? [];
        const redLine = lines.find((line) => line.includes('[31mRed'));

        expect(redLine).toBeDefined();
        const nodes = parseAnsi(redLine ?? '');
        const redNode = nodes.find(
            (node): node is React.ReactElement<{ children: string }> =>
                typeof node !== 'string' &&
                (node as React.ReactElement<{ children: string }>).props
                    .children === 'Red',
        );
        expect(redNode).toBeDefined();
        expect(
            (redNode?.props as unknown as { style: { color?: string } })
                .style.color,
        ).toBe('#aa0000');
    });
});
