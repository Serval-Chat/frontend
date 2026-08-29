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

    it('hasUsedCursorPositioning stays false for plain sequential writes', (): void => {
        const terminal = new Terminal({ size: { columns: 10, rows: 5 } });
        terminal.write('hello\nworld\n');
        expect(terminal.hasUsedCursorPositioning()).toBe(false);
    });

    it('hasUsedCursorPositioning becomes true once an explicit row/col CSI H/f is used', (): void => {
        const terminal = new Terminal({ size: { columns: 10, rows: 5 } });
        expect(terminal.hasUsedCursorPositioning()).toBe(false);
        terminal.write('\u001B[3;4Hx');
        expect(terminal.hasUsedCursorPositioning()).toBe(true);
    });

    it('a bare \\u001B[H (no row/col, e.g. as part of CLS) does not count as positioning', (): void => {
        const terminal = new Terminal({ size: { columns: 10, rows: 5 } });
        terminal.write('\u001B[2J\u001B[H');
        expect(terminal.hasUsedCursorPositioning()).toBe(false);
    });

    it('clear() and a full-screen \\u001B[2J reset hasUsedCursorPositioning', (): void => {
        const terminal = new Terminal({ size: { columns: 10, rows: 5 } });
        terminal.write('\u001B[3;4Hx');
        expect(terminal.hasUsedCursorPositioning()).toBe(true);

        terminal.clear();
        expect(terminal.hasUsedCursorPositioning()).toBe(false);

        terminal.write('\u001B[3;4Hx');
        expect(terminal.hasUsedCursorPositioning()).toBe(true);
        terminal.write('\u001B[2J');
        expect(terminal.hasUsedCursorPositioning()).toBe(false);
    });

    it('resetCursorPositioning clears the flag without touching content', (): void => {
        const terminal = new Terminal({ size: { columns: 10, rows: 5 } });
        terminal.write('\u001B[1;1Hx');
        expect(terminal.hasUsedCursorPositioning()).toBe(true);

        terminal.resetCursorPositioning();

        expect(terminal.hasUsedCursorPositioning()).toBe(false);
        expect(text(terminal)).toEqual(['x']);
    });

    it('keeps SGR color codes intact when interleaved with printable characters', (): void => {
        const terminal = new Terminal({ size: { columns: 20, rows: 5 } });

        terminal.write('\u001B[1;32mSnek Game\u001B[0m');
        expect(text(terminal)).toEqual(['\u001B[1;32mSnek Game\u001B[0m']);

        terminal.write(
            '\n\u001B[1;32m@\u001B[0m\u001B[32mo\u001B[0m\u001B[1;31m*\u001B[0m',
        );
        expect(text(terminal)).toEqual([
            '\u001B[1;32mSnek Game\u001B[0m',
            '\u001B[1;32m@\u001B[0m\u001B[32mo\u001B[0m\u001B[1;31m*\u001B[0m',
        ]);
    });
});

describe('Terminal SGR (color) handling', (): void => {
    it('preserves a truecolor SGR sequence written with a single printable char', (): void => {
        const terminal = new Terminal({ size: { columns: 20, rows: 5 } });
        const row = '\x1b[38;2;120;45;200m.\x1b[0m';

        terminal.write(row);

        expect(text(terminal)).toEqual([row]);
    });

    it('preserves many back-to-back truecolor SGR segments on one line', (): void => {
        const terminal = new Terminal({ size: { columns: 80, rows: 5 } });
        const row =
            '\x1b[38;2;13;0;92m.\x1b[0m' +
            '\x1b[38;2;46;0;92m.\x1b[0m' +
            '\x1b[38;2;66;0;92m.\x1b[0m' +
            '\x1b[38;2;0;89;92m.\x1b[0m' +
            '\x1b[38;2;0;92;36m.\x1b[0m';

        terminal.write(row);

        expect(text(terminal)).toEqual([row]);
    });

    it('preserves a line mixing short SGR codes and truecolor SGR codes', (): void => {
        const terminal = new Terminal({ size: { columns: 40, rows: 5 } });
        const row =
            '\x1b[1;32m@\x1b[0m' +
            '\x1b[38;2;10;20;30m.\x1b[0m' +
            '\x1b[32mo\x1b[0m' +
            '\x1b[38;2;40;50;60m.\x1b[0m' +
            '\x1b[1;31m*\x1b[0m';

        terminal.write(row);

        expect(text(terminal)).toEqual([row]);
    });

    it('preserves colored content across multiple lines in one write', (): void => {
        const terminal = new Terminal({ size: { columns: 40, rows: 5 } });
        const line1 = '\x1b[1;32mSnek Game\x1b[0m';
        const line2 =
            '\x1b[38;2;1;2;3m.\x1b[0m\x1b[38;2;4;5;6m.\x1b[0m';

        terminal.write(`${line1}\n${line2}`);

        expect(text(terminal)).toEqual([line1, line2]);
    });

    it('does not leak colored content across a clear() between writes', (): void => {
        const terminal = new Terminal({ size: { columns: 40, rows: 5 } });

        terminal.write('\x1b[38;2;1;2;3m.\x1b[0m\x1b[38;2;4;5;6m.\x1b[0m');
        terminal.clear();

        const row2 = '\x1b[38;2;9;9;9m.\x1b[0m';
        terminal.write(row2);

        expect(text(terminal)).toEqual([row2]);
    });
});
