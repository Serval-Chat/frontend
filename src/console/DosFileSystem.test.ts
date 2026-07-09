import { beforeEach, describe, expect, it } from 'vitest';

import { DosFileSystem } from '@/console/DosFileSystem';

describe('DosFileSystem', (): void => {
    beforeEach((): void => {
        localStorage.clear();
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
