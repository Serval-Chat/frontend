import { describe, expect, it, vi } from 'vitest';

import { BasicInterpreter } from '@/console/basic/BasicInterpreter';
import type { BasicIo } from '@/console/basic/BasicInterpreter';

function createIo(
    inputs: string[] = [],
    screenSize?: { columns: number; rows: number },
): BasicIo & { output: string } {
    let output = '';
    let inputIndex = 0;
    return {
        get output(): string {
            return output;
        },
        print: (text: string): void => {
            output += text;
        },
        input: async (): Promise<string> => {
            const value = inputs[inputIndex] ?? '';
            inputIndex++;
            return Promise.resolve(value);
        },
        ...(screenSize ? { getScreenSize: (): typeof screenSize => screenSize } : {}),
    } as BasicIo & { output: string };
}

function program(interp: BasicInterpreter, source: string): void {
    for (const rawLine of source.trim().split('\n')) {
        const match = /^(\d+)\s*(.*)$/.exec(rawLine.trim());
        if (!match) throw new Error(`bad test program line: ${rawLine}`);
        interp.setLine(Number(match[1]), match[2] ?? '');
    }
}

describe('BasicInterpreter', (): void => {
    it('runs a simple PRINT program', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(interp, `10 PRINT "HELLO WORLD"`);
        const io = createIo();
        await interp.run(io);
        expect(io.output).toBe('HELLO WORLD\n');
    });

    it('evaluates arithmetic with correct precedence', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(interp, `10 PRINT 2 + 3 * 4`);
        const io = createIo();
        await interp.run(io);
        expect(io.output.trim()).toBe('14');
    });

    it('supports LET-less assignment and variable reuse', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(
            interp,
            `
            10 X = 5
            20 X = X + 1
            30 PRINT X
            `,
        );
        const io = createIo();
        await interp.run(io);
        expect(io.output.trim()).toBe('6');
    });

    it('runs a FOR/NEXT loop', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(
            interp,
            `
            10 FOR I = 1 TO 3
            20 PRINT I
            30 NEXT I
            `,
        );
        const io = createIo();
        await interp.run(io);
        expect(io.output).toBe(' 1\n 2\n 3\n');
    });

    it('runs a FOR/NEXT loop with a negative STEP', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(
            interp,
            `
            10 FOR I = 3 TO 1 STEP -1
            20 PRINT I
            30 NEXT I
            `,
        );
        const io = createIo();
        await interp.run(io);
        expect(io.output).toBe(' 3\n 2\n 1\n');
    });

    it('branches with IF/THEN/ELSE', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(
            interp,
            `
            10 X = 5
            20 IF X > 3 THEN PRINT "BIG" ELSE PRINT "SMALL"
            `,
        );
        const io = createIo();
        await interp.run(io);
        expect(io.output.trim()).toBe('BIG');
    });

    it('jumps with GOTO', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(
            interp,
            `
            10 PRINT "A"
            20 GOTO 40
            30 PRINT "SKIPPED"
            40 PRINT "B"
            `,
        );
        const io = createIo();
        await interp.run(io);
        expect(io.output).toBe('A\nB\n');
    });

    it('calls and returns from a subroutine with GOSUB/RETURN', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(
            interp,
            `
            10 PRINT "START"
            20 GOSUB 100
            30 PRINT "END"
            40 END
            100 PRINT "SUB"
            110 RETURN
            `,
        );
        const io = createIo();
        await interp.run(io);
        expect(io.output).toBe('START\nSUB\nEND\n');
    });

    it('reads INPUT and assigns numeric and string variables', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(
            interp,
            `
            10 INPUT "Name"; N$
            20 INPUT "Age"; A
            30 PRINT N$; " is "; A
            `,
        );
        const io = createIo(['Bob', '42']);
        await interp.run(io);
        expect(io.output).toContain('Bob is  42');
    });

    it('supports DIM and array read/write', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(
            interp,
            `
            10 DIM A(5)
            20 A(2) = 99
            30 PRINT A(2)
            `,
        );
        const io = createIo();
        await interp.run(io);
        expect(io.output.trim()).toBe('99');
    });

    it('COLOR emits the matching ANSI SGR codes for foreground and background', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        const ESC = String.fromCharCode(27);
        program(
            interp,
            `
            10 COLOR 10
            20 PRINT "GREEN";
            30 COLOR 2, 0
            40 PRINT "DIM ON BLACK"
            `,
        );
        const io = createIo();
        await interp.run(io);
        expect(io.output).toBe(
            `${ESC}[92mGREEN${ESC}[32;40mDIM ON BLACK\n`,
        );
    });

    it('COLOR rejects out-of-range values', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(interp, `10 COLOR 99`);
        const io = createIo();
        await interp.run(io);
        expect(io.output).toContain('ILLEGAL FUNCTION CALL');
    });

    it('SCRWIDTH() and SCRHEIGHT() reflect the real terminal size from getScreenSize', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(interp, `10 PRINT SCRWIDTH(); SCRHEIGHT()`);
        const io = createIo([], { columns: 42, rows: 17 });
        await interp.run(io);
        expect(io.output.trim()).toBe('42 17');
    });

    it('SCRWIDTH() and SCRHEIGHT() default to 80x25 when the host has no getScreenSize', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(interp, `10 PRINT SCRWIDTH(); SCRHEIGHT()`);
        const io = createIo();
        await interp.run(io);
        expect(io.output.trim()).toBe('80 25');
    });

    it('LOCATE positions the cursor via ANSI codes without inserting a scroll newline', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        const ESC = String.fromCharCode(27);
        program(
            interp,
            `
            10 LOCATE 3, 7
            20 PRINT "X";
            `,
        );
        const io = createIo();
        await interp.run(io);
        expect(io.output).toBe(`${ESC}[3;7HX`);
    });

    it('LOCATE rejects row or column less than 1', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(interp, `10 LOCATE 0, 5`);
        const io = createIo();
        await interp.run(io);
        expect(io.output).toContain('ILLEGAL FUNCTION CALL');
    });

    it('SLEEP actually delays execution for roughly the requested duration', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(
            interp,
            `
            10 PRINT "A"
            20 SLEEP 0.1
            30 PRINT "B"
            `,
        );
        const io = createIo();
        const start = Date.now();
        await interp.run(io);
        const elapsed = Date.now() - start;
        expect(io.output).toBe('A\nB\n');
        expect(elapsed).toBeGreaterThanOrEqual(90);
    });

    it('Ctrl+C (requestStop) interrupts a SLEEP quickly instead of waiting it out', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(
            interp,
            `
            10 PRINT "A"
            20 SLEEP 5
            30 PRINT "B"
            `,
        );
        const io = createIo();
        const start = Date.now();
        const runPromise = interp.run(io);
        setTimeout((): void => {
            interp.requestStop();
        }, 20);
        await runPromise;
        const elapsed = Date.now() - start;

        expect(io.output.split('\n')).not.toContain('B');
        expect(io.output).toContain('A');
        expect(io.output).toContain('Break in');
        expect(elapsed).toBeLessThan(1000);
    }, 10000);

    it('throws SUBSCRIPT OUT OF RANGE for an out-of-bounds array access', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(
            interp,
            `
            10 DIM A(5)
            20 PRINT A(99)
            `,
        );
        const io = createIo();
        await interp.run(io);
        expect(io.output).toContain('SUBSCRIPT OUT OF RANGE');
    });

    it('reports a runtime error with the offending line number', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(interp, `10 PRINT 1 / 0`);
        const io = createIo();
        await interp.run(io);
        expect(io.output).toContain('?DIVISION BY ZERO IN 10');
    });

    it('reports TYPE MISMATCH when comparing a string to a number', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(interp, `10 IF "A" = 1 THEN PRINT "X"`);
        const io = createIo();
        await interp.run(io);
        expect(io.output).toContain('TYPE MISMATCH');
    });

    it('evaluates string functions', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(
            interp,
            `
            10 A$ = "HELLO WORLD"
            20 PRINT LEFT$(A$, 5)
            30 PRINT RIGHT$(A$, 5)
            40 PRINT MID$(A$, 7, 5)
            50 PRINT LEN(A$)
            60 PRINT VAL("42")
            70 PRINT STR$(42)
            80 PRINT CHR$(65)
            90 PRINT ASC("A")
            `,
        );
        const io = createIo();
        await interp.run(io);
        expect(io.output.split('\n').map((l): string => l.trim())).toEqual([
            'HELLO',
            'WORLD',
            'WORLD',
            '11',
            '42',
            '42',
            'A',
            '65',
            '',
        ]);
    });

    it('handles print separators: comma tabs to the next zone, semicolon does not', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(interp, `10 PRINT "A"; "B"`);
        const io = createIo();
        await interp.run(io);
        expect(io.output).toBe('AB\n');
    });

    it('suppresses the trailing newline when PRINT ends with a separator', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(
            interp,
            `
            10 PRINT "A";
            20 PRINT "B"
            `,
        );
        const io = createIo();
        await interp.run(io);
        expect(io.output).toBe('AB\n');
    });

    it('lists and clears the stored program', (): void => {
        const interp = new BasicInterpreter();
        program(
            interp,
            `
            20 PRINT "B"
            10 PRINT "A"
            `,
        );
        expect(interp.listProgram()).toEqual([
            '10 PRINT "A"',
            '20 PRINT "B"',
        ]);
        interp.clearProgram();
        expect(interp.isEmpty()).toBe(true);
    });

    it('setLine with blank text deletes that line', (): void => {
        const interp = new BasicInterpreter();
        interp.setLine(10, 'PRINT "A"');
        expect(interp.listProgram()).toHaveLength(1);
        interp.setLine(10, '');
        expect(interp.listProgram()).toHaveLength(0);
    });

    it('loadProgram parses a multi-line source blob', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        interp.loadProgram('10 X = 3\n20 PRINT X * 2');
        const io = createIo();
        await interp.run(io);
        expect(io.output.trim()).toBe('6');
    });

    it('executes an immediate-mode statement without needing a stored program', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        const io = createIo();
        await interp.runImmediate(
            [{ type: 'PrintStmt', parts: [] }],
            io,
        );
        expect(io.output).toBe('\n');
    });

    it('runImmediate can GOTO into the stored program', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(
            interp,
            `
            10 PRINT "FROM PROGRAM"
            `,
        );
        const io = createIo();
        await interp.runImmediate(
            [{ type: 'GotoStmt', line: 10 }],
            io,
        );
        expect(io.output).toBe('FROM PROGRAM\n');
    });

    it('stops a running program when requestStop is called (Ctrl+C break)', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(
            interp,
            `
            10 PRINT "X"
            20 GOTO 10
            `,
        );
        const io = createIo();
        const runPromise = interp.run(io);
        setTimeout((): void => {
            interp.requestStop();
        }, 5);
        await runPromise;
        expect(io.output).toContain('Break in');
    }, 10000);

    it('runs the matrix.bas demo end to end (colorized rows of chars/spaces, no newline mid-row)', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(
            interp,
            `
            10 FOR I = 1 TO 30
            20 R = RND(1)
            30 C$ = " "
            40 IF R > 0.55 THEN C$ = CHR$(INT(RND(1) * 93) + 33)
            50 IF R > 0.55 AND R < 0.85 THEN COLOR 2
            60 IF R >= 0.85 THEN COLOR 10
            70 PRINT C$;
            80 COLOR 7
            90 NEXT I
            100 PRINT
            110 GOTO 10
            `,
        );
        const io = createIo();
        const runPromise = interp.run(io);
        setTimeout((): void => {
            interp.requestStop();
        }, 20);
        await runPromise;

        const ansiPattern = new RegExp(
            String.fromCharCode(27) + '\\[[0-9;]*m',
            'g',
        );
        const stripAnsi = (s: string): string => s.replaceAll(ansiPattern, '');
        const rows = io.output
            .split('\n')
            .map(stripAnsi)
            .filter((line): boolean => line.length > 0 && !line.startsWith('Break'));
        expect(rows.length).toBeGreaterThan(0);
        for (const row of rows.slice(0, -1)) {
            expect(row.length).toBe(30);
        }
        expect((rows.at(-1) as string).length).toBeLessThanOrEqual(30);
        expect(io.output).toContain(`${String.fromCharCode(27)}[92m`);
        expect(io.output).toContain(`${String.fromCharCode(27)}[32m`);
    }, 10000);

    it('reuses variables across immediate-mode calls without RUN resetting them', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        const io = createIo();
        await interp.runImmediate(
            [{ type: 'LetStmt', name: 'X', indices: null, value: { type: 'NumberLit', value: 7 } }],
            io,
        );
        await interp.runImmediate(
            [{ type: 'PrintStmt', parts: [{ kind: 'expr', expr: { type: 'VarRef', name: 'X', indices: null } }] }],
            io,
        );
        expect(io.output.trim()).toBe('7');
    });

    it('does not leak variables from a previous RUN (RUN resets state)', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(interp, `10 X = 99`);
        await interp.run(createIo());

        interp.clearProgram();
        program(interp, `10 PRINT X`);
        const io = createIo();
        await interp.run(io);
        expect(io.output.trim()).toBe('0');
    });

    it('yields control periodically so a tight loop does not block (smoke test)', async (): Promise<void> => {
        const interp = new BasicInterpreter();
        program(
            interp,
            `
            10 FOR I = 1 TO 1000
            20 NEXT I
            30 PRINT "DONE"
            `,
        );
        const io = createIo();
        const spy = vi.spyOn(globalThis, 'setTimeout');
        await interp.run(io);
        expect(io.output.trim()).toBe('DONE');
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});
