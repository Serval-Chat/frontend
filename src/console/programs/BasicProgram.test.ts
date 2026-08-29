import { describe, expect, it, vi } from 'vitest';

import type { ConsoleKeyEvent } from '@/console/ConCommandRegistry';
import { DosFileSystem } from '@/console/DosFileSystem';
import { Terminal } from '@/console/Terminal';

import { BasicProgram } from './BasicProgram';

const key = (
    keyName: string,
    modifiers: Partial<Pick<ConsoleKeyEvent, 'ctrlKey' | 'altKey'>> = {},
): ConsoleKeyEvent & { preventDefault: ReturnType<typeof vi.fn> } => ({
    altKey: modifiers.altKey ?? false,
    ctrlKey: modifiers.ctrlKey ?? false,
    key: keyName,
    preventDefault: vi.fn(),
});

const screenText = (terminal: Terminal): string =>
    terminal
        .snapshot()
        .map((l): string => l.text)
        .join('\n');

function typeLine(program: BasicProgram, text: string): void {
    for (const ch of text) {
        program.handleKeyDown(key(ch));
    }
    program.handleKeyDown(key('Enter'));
}

async function waitFor(
    predicate: () => boolean,
    timeoutMs = 2000,
): Promise<void> {
    const start = Date.now();
    while (!predicate()) {
        if (Date.now() - start > timeoutMs) {
            throw new Error('waitFor: timed out');
        }
        await new Promise<void>((resolve): void => {
            setTimeout(resolve, 5);
        });
    }
}

describe('BasicProgram', (): void => {
    it('prints a banner and "Ok" on start', (): void => {
        const terminal = new Terminal({ size: { columns: 80, rows: 25 } });
        const filesystem = new DosFileSystem();
        const program = new BasicProgram({
            terminal,
            filesystem,
            onExit: vi.fn(),
        });

        program.start();

        const text = screenText(terminal);
        expect(text).toContain('Serchat BASIC');
        expect(text).toContain('Ok');
    });

    it('stores a numbered line without executing it, and LIST shows it', async (): Promise<void> => {
        const terminal = new Terminal({ size: { columns: 80, rows: 25 } });
        const filesystem = new DosFileSystem();
        const program = new BasicProgram({
            terminal,
            filesystem,
            onExit: vi.fn(),
        });
        program.start();

        typeLine(program, '10 PRINT "HELLO"');
        typeLine(program, 'LIST');
        await waitFor((): boolean =>
            screenText(terminal).includes('10 PRINT "HELLO"'),
        );

        expect(screenText(terminal)).not.toContain('HELLO\n');
    });

    it('RUN executes the stored program', async (): Promise<void> => {
        const terminal = new Terminal({ size: { columns: 80, rows: 25 } });
        const filesystem = new DosFileSystem();
        const program = new BasicProgram({
            terminal,
            filesystem,
            onExit: vi.fn(),
        });
        program.start();

        typeLine(program, '10 PRINT "HELLO FROM BASIC"');
        typeLine(program, 'RUN');

        await waitFor((): boolean =>
            screenText(terminal).includes('HELLO FROM BASIC'),
        );
    });

    it('SCRWIDTH()/SCRHEIGHT() reflect the real live Terminal size', async (): Promise<void> => {
        const terminal = new Terminal({ size: { columns: 37, rows: 19 } });
        const filesystem = new DosFileSystem();
        const program = new BasicProgram({
            terminal,
            filesystem,
            onExit: vi.fn(),
        });
        program.start();

        typeLine(program, 'PRINT SCRWIDTH(); SCRHEIGHT()');

        await waitFor((): boolean => screenText(terminal).includes('37 19'));
    });

    it('executes an immediate-mode statement directly, without storing it', async (): Promise<void> => {
        const terminal = new Terminal({ size: { columns: 80, rows: 25 } });
        const filesystem = new DosFileSystem();
        const program = new BasicProgram({
            terminal,
            filesystem,
            onExit: vi.fn(),
        });
        program.start();

        const okCount = (): number =>
            screenText(terminal)
                .split('\n')
                .filter((l): boolean => l.trim() === 'Ok').length;

        typeLine(program, 'PRINT 2 + 2');
        await waitFor((): boolean => okCount() >= 2);
        const fourCountBefore = screenText(terminal).split(' 4').length - 1;

        typeLine(program, 'RUN');
        await waitFor((): boolean => okCount() >= 3);

        const fourCountAfter = screenText(terminal).split(' 4').length - 1;
        expect(fourCountAfter).toBe(fourCountBefore);
    });

    it('NEW clears the stored program', async (): Promise<void> => {
        const terminal = new Terminal({ size: { columns: 80, rows: 25 } });
        const filesystem = new DosFileSystem();
        const program = new BasicProgram({
            terminal,
            filesystem,
            onExit: vi.fn(),
        });
        program.start();

        typeLine(program, '10 PRINT "X"');
        typeLine(program, 'NEW');
        typeLine(program, 'RUN');

        await waitFor((): boolean => {
            const lines = screenText(terminal).split('\n');
            const lastOk = lines.lastIndexOf('Ok');
            return lastOk >= 0;
        });
        expect(screenText(terminal)).not.toContain('X\n');
    });

    it('pauses on INPUT and resumes once the user answers', async (): Promise<void> => {
        const terminal = new Terminal({ size: { columns: 80, rows: 25 } });
        const filesystem = new DosFileSystem();
        const program = new BasicProgram({
            terminal,
            filesystem,
            onExit: vi.fn(),
        });
        program.start();

        typeLine(program, '10 INPUT "Name"; N$');
        typeLine(program, '20 PRINT "HI "; N$');
        typeLine(program, 'RUN');

        await waitFor((): boolean => screenText(terminal).includes('Name?'));
        typeLine(program, 'WORLD');

        await waitFor((): boolean => screenText(terminal).includes('HI WORLD'));
    });

    it('SAVE and LOAD round-trip a program through the filesystem', async (): Promise<void> => {
        const terminal = new Terminal({ size: { columns: 80, rows: 25 } });
        const filesystem = new DosFileSystem();
        const program = new BasicProgram({
            terminal,
            filesystem,
            onExit: vi.fn(),
        });
        program.start();

        typeLine(program, '10 PRINT "SAVED PROGRAM"');
        typeLine(program, 'SAVE TEST.BAS');
        await waitFor((): boolean => screenText(terminal).includes('Saved.'));

        typeLine(program, 'NEW');
        typeLine(program, 'LOAD TEST.BAS');
        await waitFor((): boolean =>
            screenText(terminal).includes('Loaded.'),
        );

        typeLine(program, 'RUN');
        await waitFor((): boolean =>
            screenText(terminal).includes('SAVED PROGRAM'),
        );
    });

    it('SYSTEM exits the program', (): void => {
        const terminal = new Terminal({ size: { columns: 80, rows: 25 } });
        const filesystem = new DosFileSystem();
        const onExit = vi.fn();
        const program = new BasicProgram({ terminal, filesystem, onExit });
        program.start();

        typeLine(program, 'SYSTEM');

        expect(onExit).toHaveBeenCalledTimes(1);
    });

    it('SYSTEM resets cursor-positioning so the normal prompt auto-scrolls again after a LOCATE-heavy program', async (): Promise<void> => {
        const terminal = new Terminal({ size: { columns: 80, rows: 25 } });
        const filesystem = new DosFileSystem();
        const program = new BasicProgram({
            terminal,
            filesystem,
            onExit: vi.fn(),
        });
        program.start();

        typeLine(program, 'LOCATE 3, 4');
        await waitFor((): boolean => {
            const okCount = screenText(terminal)
                .split('\n')
                .filter((l): boolean => l.trim() === 'Ok').length;
            return terminal.hasUsedCursorPositioning() && okCount >= 2;
        });

        typeLine(program, 'SYSTEM');

        expect(terminal.hasUsedCursorPositioning()).toBe(false);
    });

    it('Ctrl+C breaks a runaway loop', async (): Promise<void> => {
        const terminal = new Terminal({ size: { columns: 80, rows: 25 } });
        const filesystem = new DosFileSystem();
        const program = new BasicProgram({
            terminal,
            filesystem,
            onExit: vi.fn(),
        });
        program.start();

        typeLine(program, '10 PRINT "LOOP"');
        typeLine(program, '20 GOTO 10');
        typeLine(program, 'RUN');

        await waitFor((): boolean => screenText(terminal).includes('LOOP'));
        program.handleKeyDown(key('c', { ctrlKey: true }));

        await waitFor((): boolean => screenText(terminal).includes('Break'));
    }, 10000);

    it('Backspace edits the in-progress immediate-mode line', async (): Promise<void> => {
        const terminal = new Terminal({ size: { columns: 80, rows: 25 } });
        const filesystem = new DosFileSystem();
        const program = new BasicProgram({
            terminal,
            filesystem,
            onExit: vi.fn(),
        });
        program.start();

        for (const ch of 'PRINT 9') {
            program.handleKeyDown(key(ch));
        }
        program.handleKeyDown(key('Backspace'));
        for (const ch of '3') {
            program.handleKeyDown(key(ch));
        }
        program.handleKeyDown(key('Enter'));

        await waitFor((): boolean => screenText(terminal).includes('3'));
        expect(screenText(terminal)).not.toContain('PRINT 9');
    });

    it('loads an existing file passed as initialFile', (): void => {
        const terminal = new Terminal({ size: { columns: 80, rows: 25 } });
        const filesystem = new DosFileSystem();
        filesystem.writeFile('AUTO.BAS', '10 PRINT "AUTOLOADED"');
        const program = new BasicProgram({
            terminal,
            filesystem,
            onExit: vi.fn(),
            initialFile: 'AUTO.BAS',
        });

        program.start();

        expect(screenText(terminal)).toContain('Loaded.');
    });

    it('starts with an empty program if initialFile does not exist', (): void => {
        const terminal = new Terminal({ size: { columns: 80, rows: 25 } });
        const filesystem = new DosFileSystem();
        const program = new BasicProgram({
            terminal,
            filesystem,
            onExit: vi.fn(),
            initialFile: 'NOPE.BAS',
        });

        program.start();

        expect(screenText(terminal)).not.toContain('Loaded.');
        expect(screenText(terminal)).toContain('Ok');
    });
});
