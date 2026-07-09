import { describe, expect, it } from 'vitest';

import { Terminal } from '@/console/Terminal';

const text = (terminal: Terminal): string[] =>
    terminal.snapshot().map((line): string => line.text);

describe('Terminal ANSI screen controls', (): void => {
    it('supports clear-screen, cursor positioning, and erase-line', (): void => {
        const terminal = new Terminal({ size: { columns: 10, rows: 5 } });

        terminal.write('hello\nworld');
        expect(text(terminal)).toEqual(['hello', 'world']);

        terminal.write('\u001B[2J\u001B[3;4Hdos');
        expect(text(terminal)).toEqual(['', '', '   dos']);

        terminal.write('\u001B[3;5H\u001B[K');
        expect(text(terminal)).toEqual(['', '', '   d']);
    });

    it('supports relative cursor movement', (): void => {
        const terminal = new Terminal({ size: { columns: 10, rows: 5 } });

        terminal.write('\u001B[2;2HA\u001B[2DB');
        expect(text(terminal)).toEqual(['', 'BA']);

        terminal.write('\u001B[1B\u001B[3CZ');
        expect(text(terminal)).toEqual(['', 'BA', '    Z']);
    });
});
