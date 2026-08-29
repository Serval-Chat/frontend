import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { BasicIo } from '@/console/basic/BasicInterpreter';
import { BasicInterpreter } from '@/console/basic/BasicInterpreter';
import { DosFileSystem } from '@/console/DosFileSystem';

describe('DosFileSystem', (): void => {
    beforeEach((): void => {
        localStorage.clear();
    });

    afterEach((): void => {
        vi.restoreAllMocks();
    });

    it(
        String.raw`starts at C:\ and persists entries to localStorage`,
        (): void => {
            const fs = new DosFileSystem();

            fs.makeDirectory('APPS');
            fs.writeFile(String.raw`APPS\HELLO.TXT`, 'hello');

            const reloaded = new DosFileSystem();
            reloaded.changeDirectory('APPS');

            expect(reloaded.getCwd()).toBe(String.raw`C:\APPS`);
            expect(reloaded.readFile('HELLO.TXT')).toBe('hello');
        },
    );

    it('seeds a MATRIX.BAS demo on a fresh filesystem that loads as a valid BASIC program', (): void => {
        const fs = new DosFileSystem();

        const source = fs.readFile('MATRIX.BAS');
        const interp = new BasicInterpreter();
        expect(() => interp.loadProgram(source)).not.toThrow();
        expect(interp.isEmpty()).toBe(false);
    });

    it('MATRIX.BAS runs end to end, respecting the given screen width and coloring output', async (): Promise<void> => {
        vi.spyOn(Math, 'random').mockReturnValue(0.99);

        const fs = new DosFileSystem();
        const interp = new BasicInterpreter();
        interp.loadProgram(fs.readFile('MATRIX.BAS'));

        let output = '';
        const io: BasicIo = {
            print: (text): void => {
                output += text;
            },
            input: async (): Promise<string> => '',
            getScreenSize: (): { columns: number; rows: number } => ({
                columns: 10,
                rows: 25,
            }),
        };

        const runPromise = interp.run(io);
        setTimeout((): void => {
            interp.requestStop();
        }, 150);
        await runPromise;

        expect(output).toContain('Break in');
        const esc = String.fromCharCode(27);
        expect(output).toContain(`${esc}[2J${esc}[H`);
        expect(new RegExp(`${esc}\\[\\d+;\\d+H`).test(output)).toBe(true);
        expect(output).toContain(`${esc}[92m`);
    }, 10000);

    it('reset() wipes custom files and re-seeds the default fresh-install files', (): void => {
        const fs = new DosFileSystem();
        fs.makeDirectory('APPS');
        fs.writeFile('CUSTOM.TXT', 'my stuff');
        expect(fs.readFile('CUSTOM.TXT')).toBe('my stuff');

        fs.reset();

        expect(fs.getCwd()).toBe('C:\\');
        expect(() => fs.readFile('CUSTOM.TXT')).toThrow();
        expect(fs.readFile('README.TXT')).toContain('Serchat Console');
        expect(fs.readFile('MATRIX.BAS')).toContain('SCRWIDTH()');

        const reloaded = new DosFileSystem();
        expect(() => reloaded.readFile('CUSTOM.TXT')).toThrow();
        expect(reloaded.readFile('README.TXT')).toContain('Serchat Console');
    });

    it('enforces 8.3 names', (): void => {
        const fs = new DosFileSystem();

        expect(() => fs.makeDirectory('TOOLONGNAME')).toThrow(
            'The filename, directory name, or volume label syntax is incorrect.',
        );
        expect(() => fs.writeFile('LONGFILE1.TXT', '')).toThrow(
            'The filename, directory name, or volume label syntax is incorrect.',
        );
    });

    it('copies, moves, renames, and deletes files', (): void => {
        const fs = new DosFileSystem();

        fs.writeFile('A.TXT', 'alpha');
        fs.copy('A.TXT', 'B.TXT');
        fs.move('B.TXT', 'C.TXT');
        fs.rename('C.TXT', 'D.TXT');

        expect(fs.readFile('A.TXT')).toBe('alpha');
        expect(fs.readFile('D.TXT')).toBe('alpha');
        expect(fs.delete('D.TXT')).toBe(1);
        expect((): string => fs.readFile('D.TXT')).toThrow(
            'The system cannot find the path specified.',
        );
    });

    it('sets and clears file attributes', (): void => {
        const fs = new DosFileSystem();

        fs.writeFile('LOCK.TXT', 'locked');
        const locked = fs.setAttributes('LOCK.TXT', ['+R'])[0];
        expect(locked?.attributes).toContain('R');
        expect((): number => fs.delete('LOCK.TXT')).toThrow(
            'Access is denied.',
        );
        expect(() => fs.writeFile('LOCK.TXT', 'changed')).toThrow(
            'Access is denied.',
        );
        const unlocked = fs.setAttributes('LOCK.TXT', ['-R'])[0];
        expect(unlocked?.attributes).not.toContain('R');
        expect(fs.delete('LOCK.TXT')).toBe(1);
    });
});
