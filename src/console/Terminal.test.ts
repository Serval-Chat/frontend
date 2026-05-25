import { describe, expect, it } from 'vitest';

import { Terminal } from '@/console/Terminal';

const text = (terminal: Terminal): string[] =>
    terminal.snapshot().map((line) => line.text);

describe('Terminal ANSI screen controls', () => {
    it('supports clear-screen, cursor positioning, and erase-line', () => {
        const terminal = new Terminal({ size: { columns: 10, rows: 5 } });

        terminal.write('hello\nworld');
        expect(text(terminal)).toEqual(['hello', 'world']);

        terminal.write('\u001b[2J\u001b[3;4Hdos');
        expect(text(terminal)).toEqual(['', '', '   dos']);

        terminal.write('\u001b[3;5H\u001b[K');
        expect(text(terminal)).toEqual(['', '', '   d']);
    });

    it('supports relative cursor movement', () => {
        const terminal = new Terminal({ size: { columns: 10, rows: 5 } });

        terminal.write('\u001b[2;2HA\u001b[2DB');
        expect(text(terminal)).toEqual(['', 'BA']);

        terminal.write('\u001b[1B\u001b[3CZ');
        expect(text(terminal)).toEqual(['', 'BA', '    Z']);
    });
});
